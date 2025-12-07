# Fix MongoDB Connection Error

## Quick Fix Steps

### Step 1: Check MongoDB Atlas Cluster Status

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Log in to your account
3. Click on your cluster name
4. **Check if it says "Paused"** - if so:
   - Click the **"Resume"** button
   - Wait 1-2 minutes for the cluster to start
   - Try running the server again

### Step 2: Whitelist Your IP Address (MOST COMMON ISSUE)

1. In MongoDB Atlas, click **"Network Access"** in the left sidebar
2. Click **"Add IP Address"** button
3. For **testing/development**, you can:
   - Click **"Allow Access from Anywhere"** 
   - This adds `0.0.0.0/0` (allows all IPs)
   - ⚠️ **WARNING**: Only use this for development, NOT for production!
4. Or add your specific IP:
   - Click **"Add Current IP Address"**
   - Or manually enter your IP
5. Click **"Confirm"**
6. Wait 1-2 minutes for changes to take effect
7. Try running the server again

### Step 3: Verify Connection String

1. In MongoDB Atlas, go to **Clusters**
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **Node.js** and version **5.5 or later**
5. Copy the connection string
6. It should look like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Update your `.env` file with this connection string
8. Make sure to replace `<username>` and `<password>` with your actual credentials

### Step 4: Check Password Special Characters

If your password contains special characters like `@`, `#`, `%`, `&`, etc., you need to URL-encode them:

- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`
- `/` → `%2F`
- `:` → `%3A`

**Example:**
- Password: `my@pass#123`
- Encoded: `my%40pass%23123`
- Connection string: `mongodb+srv://username:my%40pass%23123@cluster0...`

### Step 5: Test Connection

After making changes:

1. Restart your server:
   ```bash
   cd server
   npm run dev
   ```

2. Look for:
   - ✅ `MongoDB connected successfully`
   - ✅ `Server running on port 5000`

3. If still failing, check the detailed error message in the console

## Common Error Messages

### `ECONNREFUSED` or `querySrv`
- **Cause**: IP not whitelisted or DNS issues
- **Fix**: Whitelist IP in Network Access (Step 2)

### `authentication failed`
- **Cause**: Wrong username or password
- **Fix**: Verify credentials in MongoDB Atlas → Database Access

### `timeout`
- **Cause**: Network issues or cluster paused
- **Fix**: Resume cluster and check network

## Still Not Working?

1. Check MongoDB Atlas status page: https://status.mongodb.com/
2. Try connecting from MongoDB Compass (desktop app) to test connection
3. Check your firewall/antivirus isn't blocking the connection
4. Try using a different network (mobile hotspot) to rule out network issues

