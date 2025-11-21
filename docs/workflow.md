## Workflow

1. User upload a CSV file through the Frontend.
2. Backend validate the file, remove duplicates and split into files with up to 50.000 emails (approximately 1Mb) and send it to the `Cloud Storage`;
3. This file content will be a JSON file with the ID of the table `emailsys` on the database and the list of emails;
4. Each file uploaded to `Cloud Storage` triggers a `Cloud Function`, let's call it `enqueueEmailsFromFile` , that insert each one of the emails in the `Database` with `pending` status;
5. On backend is available the endpoint `GET /send-emails/from-queue` which will control the flow of email sending;
6. The backend need to control the amount of emails sent by minute, for it we configure two env vars:
    1. `EMAILCRON_MAXEMAILSBYMINUTE` the amount of emails that can be sent by minute, this number is divided by 60 so, for example, when it's 5 the interval between each sending is 12 seconds.
    2. `EMAILCRON_MAXMINUTES` the interval configured on the Cronjob, so the sistem can calculate the amount of emails that will be sent while this request.
7. For each `pending` email update status to `processing` then generate a `Base62` token based on its ID with a SALT so we have a predictable and reversible token, call the API to send this email and then set it as `sent` on database;
8. In error cases the Cronjob can save logs or should implement some service to do it so on backend like Sentry or Crashlytics. The email status is updated to `error` , so the system can have a routine to retry.
9. Create a Cronjob (could be Cloud Scheduler) to make this request periodicaly. 

## Pros

The only thing that Backend will do is to upload the files to the Cloud Storage and then the user is free to continue navigating on the Frontend. It's a good practice to limit the file up to 5Mb (around 250k emails) or something like that.

Cloud Function can handle by itself the server resources, so it will never be blocked. Another good thing about it are the logs that can be collected as needed and centralized on GCP.

Generate the email token from a Base62 logic with the Database ID will guaranty that the token will never repeat for different IDs, it is predictable and reversible.

Each request on the Email Service API need to be authenticated and the JWT token is valid only for 30 minutes, so we make a cache for this token and request a new one only when need.

It’s possible for the user to follow the status of sending with a simple Postgres query:

```jsx
SELECT 
  e.id AS emailsys_id,
  COALESCE(s.pending, 0) AS pending,
  COALESCE(s.sent, 0) AS sent,
  COALESCE(s.processing, 0) AS processing,
  COALESCE(s.error, 0) AS error
FROM emailsys e
LEFT JOIN (
  SELECT 
    fk_emailsys,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending,
    COUNT(*) FILTER (WHERE status = 'sent') AS sent,
    COUNT(*) FILTER (WHERE status = 'processing') AS processing,
    COUNT(*) FILTER (WHERE status = 'error') AS error
  FROM emailsys_item
  GROUP BY fk_emailsys
) s ON s.fk_emailsys = e.id;
```

## Cons

This workflow is scalable untill some limit. Cronjob minimum interval is 1 minute and this approach does not support concurrent calls because of the status of items on database.

Because of the sending is made through an endpoint inside the NestJS backend it might block or consume too much Cloud resources if the amount of emails sent grows up.

The cost of the Cloud architecture is less predictable, the more processing queues the more cost will have.

## Considerations

Cloud Task with another function to send the emails would probably be a better choice to make it more scalable.

Task is really easy to configure in terms of rate limit so it won't be a problem at all. Also we can configure the amount of concurrent tasks if needed.

Each task on the queue will be retried in case of fail, this is also configurable on Cloud Tasks.

## Frontend

We will be using Next.js.

## Backend

NestJS will be the framework we'll be using for it.

## Database

Cloud SQL Postgres will be my choice. It could be MySQL, but I've been working with Postgres lately.