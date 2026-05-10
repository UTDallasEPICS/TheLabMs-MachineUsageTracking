# Third-Party Integrations

The system uses several external services and libraries to function:

## Nuxt.js

A full-stack framework that handles both the website interface and the backend server. It provides the foundation for the entire application.

**What it does:**
- Displays the web pages users see in their browser
- Handles the backend API that IoT devices communicate with
- Manages routing between different pages
- Manages the server that receives data from sensors

## Vue.js

The component framework used to build all the interactive pages and buttons users see on the dashboard.

**What it does:**
- Makes the calendar view interactive
- Makes the timeline view interactive
- Handles form inputs for login and registration
- Updates the page in real-time when data changes

## Prisma

A database tool that manages how data is stored and retrieved.

**What it does:**
- Stores user accounts, passwords, and sessions
- Stores machine information and API keys
- Stores sensor data and usage sessions
- Provides access to data throughout the application

## Bcrypt

A security library that hashes (encrypts one-way) passwords so they're never stored in plain text.

**What it does:**
- Converts passwords to hashes when users create accounts
- Verifies passwords during login
- Makes it impossible to recover the original password from what's stored in the database

## Nodemailer

An email service that sends password reset emails.

**What it does:**
- Sends password reset links when users request them
- Sends password reset links when admins request them for other users
- Uses SMTP configuration to route emails through your email provider

## Nuxt Auth Utils

Manages user login sessions and keeps track of who is logged in.

**What it does:**
- Creates sessions when users log in
- Keeps sessions alive across page reloads
- Stores user role information (admin vs. regular user)
- Automatically logs users out when sessions expire

