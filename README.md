# Contact Server

A Node.js Express backend server with SQLite database for the Contact Management application.

## Features

- RESTful API for contacts management
- SQLite database for data persistence
- CORS support for frontend integration
- Error handling middleware

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /contacts | Get all contacts |
| GET    | /contacts/:id | Get a single contact by ID |
| POST   | /contacts | Create a new contact |
| PUT    | /contacts/:id | Update an existing contact |
| DELETE | /contacts/:id | Delete a contact |

## Contact Data Structure

```json
{
  "id": 1,
  "firstname": "John",
  "lastname": "Doe",
  "email": "john.doe@example.com",
  "homephone": "555-1234",
  "mobile": "555-5678",
  "address": "123 Main St, Anytown",
  "birthday": "1990-01-01",
  "created_at": "2023-07-19T12:00:00.000Z",
  "updated_at": "2023-07-19T12:00:00.000Z"
}
```

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```
   
   Or for development with auto-restart:
   ```
   npm run dev
   ```

3. The server will run on port 4000 by default (http://localhost:4000)

## Environment Variables

- `PORT` - Port to run the server on (default: 4000)
- `NODE_ENV` - Environment mode (development, production) 