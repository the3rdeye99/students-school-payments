# School Bills

## Overview

School Bills is a web application designed to manage student payments and billing records efficiently. It caters to Primary, Secondary, and University level students, providing a comprehensive solution for tracking fees, payments, and outstanding balances.

## Features

*   Student Records Management: Add, edit, and delete student bill records.
*   Automated Bill Calculation: Calculate bills based on school type and term/semester fees.
*   Payment Tracking: Track payments received and outstanding balances.
*   Previous Bills: View and manage historical billing data.
*   Data Import/Export: Upload and export data using CSV files (Note: CSV upload may require further implementation).
*   Search and Filter: Find student records using search and filter options.
*   Summary Statistics: View total students, current bills, amount paid, and outstanding balance.

## Technologies Used

*   [Next.js](https://nextjs.org/)
*   [React](https://reactjs.org/)
*   [Lucide React](https://lucide.dev/)
*   [Mongoose](https://mongoosejs.com/)
*   [MongoDB](https://www.mongodb.com/)
*   [Tailwind CSS](https://tailwindcss.com/)

## Prerequisites

*   [Node.js](https://nodejs.org/) (version 18 or higher)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) or [pnpm](https://pnpm.io/)
*   [MongoDB](https://www.mongodb.com/)

## Installation

1.  `git clone <repository_url>`
2.  `cd school-bills`
3.  `npm install`

## Configuration

### Environment Variables

Create a `.env.local` file:

*   `MONGODB_URI`: MongoDB database URI (e.g., `mongodb://localhost:27017/school-bills`)

### Database Setup

Configure `MONGODB_URI` to point to your MongoDB database.

## Running the Application

1.  `npm run dev`
2.  Open `http://localhost:3000`

## Building and Running for Production

1.  `npm run build`
2.  `npm run start`

## Usage

1.  Add Student Records: Use "Add Primary Student," "Add Secondary Student," or "Add University Student" buttons.
2.  Edit Records: Modify table rows.
3.  Save Bills: Click "Save."
4.  View Previous Bills: Click "View Previous Bills."
5.  Search and Filter: Use the search bar and filter button.

## Contributing

Contributions are welcome.

## License

[MIT](LICENSE)

