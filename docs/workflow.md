# Workflow and Decisions

Specifications at https://github.com/marcobraghim/cnx-software-engineer-technical-challenge

## Workflow

1. User upload a CSV file through the Frontend.
2. Backend validate the file, split into files with up to 50.000 emails (approximately 1Mb) and send it to the `Cloud Storage`;
3. This file content will be a JSON file with the ID of the table `emailsys` on the database and the list of emails;
4. Each file uploaded to `Cloud Storage` triggers a `Cloud Function`, let's call it `enqueueEmailsFromFile` , that insert each one of the emails in the `Database` avoiding duplicates with `pending` status;
5. After insertion create one `Cloud Task` for each one;
6. `Cloud Task` is configurable about the rate limit so it will dispatch one `Cloud Function` by email called `sendEmailsFromQueue` with no concurrent tasks;
7. The function `sendEmailsFromQueue` will get the next `pending` email on the database and put it to `processing`, this UPDATE need to avoid concurrency by using `FOR UPDATE SKIP LOCKED` on the Postgres statement;
8. So we generate a `Base62` token based on its ID with a SALT with no timestamp to be sure that the token will never ever repeat for any ID, call the API to send this email and then set it as `sent` on database;
9. In error cases we use the logs from GCP, besides we use try/catch blocks on functions to make it work properly. `sendEmailsFromQueue` will revert the email status to `pending` for example, so the system can retry it.

## Pros

The only thing that Backend will do is to validate upload the files to the Cloud Storage and then the user is free to continue navigating on the Frontend. It's a good practice to limit the file up to 5Mb or something like that.

Cloud Function can handle by itself the server resources, so it will never be blocked. Another good thing about it are the logs that can be collected as needed and centralized on GCP.

Cloud Task is really easy to configure in terms of rate limit so it won't be a problem at all. Also we can configure the amount of concurrent tasks if needed.

Each task on the queue will be retried in case of fail, this is also configurable on Cloud Tasks.

Generate the email token from a Base62 logic with the Database ID will guaranty that the token will never repeat and with the fixed shuffle and a SALT we can avoid next ID to be predictable.

On frontend it’s possible for the user to follow how many emails was already sent, processing and pending.

## Cons

The low rate of limit on sending API make this architecture overkill in terms of Cloud Tasks, which could be replaced by a Cronjob, but this approach was decided based on a high scalable system potential.

The cost of the Cloud architecture is less predictable, the more processing queues the more cost will have.

## Frontend

Next.js is fast, SEO-friendly, with built-in SSR/SSG and optimized performance by default.

## Backend

The NestJS framework provides a well-structured architecture and TypeScript, making it a reliable and scalable solution.

## Database

Cloud SQL Postgres will be my choice. It could be MySQL, but I've been working with Postgres lately.