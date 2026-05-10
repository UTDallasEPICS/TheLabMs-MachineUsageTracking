# Roles & Permissions

## User Role

**What they can do:**
- Create an account
- Log in and log out
- View the machine usage dashboard
- View daily timeline details for any date
- View live timers showing currently active machines
- Reset their own password

## Admin Role

**What they can do:**
- Log in to the admin panel (separate admin login)
- View pending user registrations
- Approve or deny user registrations
- View all registered users
- Delete user accounts
- Reset user passwords
- Register new machines
- Edit machine settings
- Delete machines
- View all machines
- Change their own admin password
- Reset their own admin password

## Microcontroller Role 

**What they can do:**
- Report when a machine turns ON
- Report when a machine turns OFF
- Send sensor data and status updates

**What they cannot do:**
- Read user accounts or sessions
- Modify configurations
- Access user dashboards
- Manage other devices
- View historical data (only writes data, doesn't read it)

## Access Control

- **Regular users** and **admins** use completely separate login systems
- **Regular users** cannot see the admin panel, and **admins** cannot see the user dashboard
- **IoT devices** use API keys instead of usernames/passwords
- Each IoT device only has permission to post data for its own machine
