# How to Access Admin Interface

## Making a User an Admin

To access the admin interface, you need to manually set a user's role to "admin" in MongoDB.

### Method 1: Using MongoDB Compass (GUI)

1. Open MongoDB Compass
2. Connect to your database (use the same connection string from your `.env` file)
3. Navigate to the `quizmernapp` database (or your `DB_NAME`)
4. Open the `users` collection
5. Find the user you want to make admin (search by email)
6. Click on the document to edit it
7. Change the `role` field from `"user"` to `"admin"`
8. Save the document

### Method 2: Using MongoDB Shell (mongosh)

1. Connect to your MongoDB:
   ```bash
   mongosh "your-connection-string"
   ```
   Or if using local MongoDB:
   ```bash
   mongosh
   ```

2. Switch to your database:
   ```javascript
   use quizmernapp
   ```

3. Update the user's role:
   ```javascript
   db.users.updateOne(
     { email: "user@example.com" },
     { $set: { role: "admin" } }
   )
   ```
   Replace `"user@example.com"` with the actual email of the user you want to make admin.

### Method 3: Using MongoDB Atlas Web Interface

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Log in to your account
3. Select your cluster
4. Click "Browse Collections"
5. Select your database (`quizmernapp`)
6. Open the `users` collection
7. Find and click on the user document
8. Click "Edit Document"
9. Change `role: "user"` to `role: "admin"`
10. Click "Update"

## After Making a User Admin

1. Log out and log back in with that user account
2. You should now see an "Admin" link in the header
3. Click "Admin" to access the admin dashboard where you can:
   - Create and manage quiz days
   - Add questions to quiz days
   - View leaderboards
   - See individual user results

## Admin Features

Once logged in as admin, you can:
- **Create Quiz Days**: Set up new quiz days with custom date labels
- **Add Questions**: Create questions for Quran and Seerat sections
- **View Leaderboard**: See top performers for each quiz day
- **View User Results**: See individual user submissions with section-wise scores

