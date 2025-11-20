# dbdiagram.io

Database diagram

```
Table user {
  id integer [pk]
  name varchar
  email varchar
  created_at timestamp
  updated_at timestamp
}

Table emailsys {
  id integer [pk]
  fk_user integer
  created_at timestamp
  updated_at timestamp
}
Ref: emailsys.fk_user > user.id

Table emailsys_item_status {
  value varchar [pk, unique]
  created_at timestamp
  updated_at timestamp
}

Table emailsys_item {
  id integer [pk]
  fk_emailsys integer
  emailto varchar
  status varchar
  created_at timestamp
  updated_at timestamp
}
Ref: emailsys_item.fk_emailsys > emailsys.id
Ref: emailsys_item.status > emailsys_item_status.value

Table emailserviceapi {
  id integer [pk]
  jwttoken varchar
  expiration timestamp
  created_at timestamp
  updated_at timestamp
}
```