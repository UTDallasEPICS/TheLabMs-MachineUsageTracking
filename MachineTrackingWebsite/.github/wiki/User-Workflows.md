# User Workflows

There are three types of users in this system:

## Regular User

Regular users are lab technicians or equipment operators who want to see machine usage data.

**Typical workflow:**
1. User creates an account by entering email and password on the registration page
2. User logs in with their credentials
3. User views the dashboard, which shows a monthly calendar with usage percentages for each machine
4. User can click any date to see a detailed timeline view showing exactly when each machine was active
5. User can log out when done

If a user forgets their password, they can request a password reset from the login page. They'll receive an email with a reset link.

## Admin

Admins manage the system, including registering machines and managing user accounts.

**Typical workflow:**
1. Admin logs in through the admin login page (separate from regular user login) using their admin credentials
2. Admin accesses the admin dashboard where they can:
   - View pending user registrations and approve or deny them
   - View all registered users and delete accounts if needed
   - Register new machines (IoT sensors) and get API keys for them
   - Edit or delete existing machines
3. Admin can reset user passwords if needed
4. Admin can change their own password
5. Admin logs out

## (Microcontroller)

Microcontrollers with sensors that report when the machines turn ON or OFF.

**Typical workflow:**
1. Admin registers the device in the admin panel and receives an API key
2. Device is configured with the API key and server address
3. Device monitors the physical machine's state
4. When the machine turns ON, device sends a start signal to the server
5. While the machine is active, device continuously sends sensor data
6. When the machine turns OFF, device sends an end signal to the server
7. Server records this as a usage session

The device operates automatically in the background. If the device loses network connection, it may queue data locally and resend when reconnected. If a device stays connected for more than 24 hours without sending an end signal, the system automatically closes the session.
