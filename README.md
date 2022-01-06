# fyp-delegation-prototype
PDP prototype for testing delegation

## Pensions Dashboards Programme - Find your pensions delegation prototype
This is a prototype to test the Consent and Authorisation part of the Find your pensions service. The users need to give consent before the find of their pensions can take place.
## MongoDB is used to hold pension details
To use this prototype you will need to set up a MongoDB database. There are two collections pensionDetails and pensionProvider. This allows pension details to be added at the time of testing so that the user sees information that is relevant to them.
## Envionment variables
- MONGODB_URI - for the MongoDB access 
- PENSIONS_DB - the database name
- PARTICIPANT_NUMBER - so that different user information can be held on the same database, set this to 0 to view all the pensions on the selected database
## User journey
The user starts out at the dashboard and is redirected to the identity service and then to the Consent and Authorisation service and finally back to the dashboard to view their pensions
