# Specialized AI Agents - Data Schema Definition

This document defines the technical structure of the Google Sheets used by the Analyst Agent. Any modifications to the sheets MUST follow this schema to prevent system failures.

## 📊 Sheet: `Sales`
Used for revenue analysis and sales tracking.

| Column | Name | Type | Description |
| :--- | :--- | :--- | :--- |
| A | `Date` | Date | Transaction date (ISO 8601 recommended) |
| B | `Product Name` | String | Name of the product sold |
| C | `Quantity` | Integer | Number of units sold |
| D | `Unit Price` | Decimal | Price per unit (Numeric only) |
| E | `Total` | Decimal | Total amount (Quantity * Price) |

## 📦 Sheet: `Inventory`
Used for stock management and reorder alerts.

| Column | Name | Type | Description |
| :--- | :--- | :--- | :--- |
| A | `Product Name` | String | Unique product identifier |
| B | `Category` | String | Product grouping category |
| C | `Stock Level` | Integer | Current units in stock |
| D | `Min Requirement`| Integer | Threshold for reorder alerts |

## 💸 Sheet: `Expenses`
Used for cost tracking and ROI calculation.

| Column | Name | Type | Description |
| :--- | :--- | :--- | :--- |
| A | `Date` | Date | Expense date |
| B | `Description` | String | Details of the expenditure |
| C | `Category` | String | Expense category (e.g., Marketing, Ops) |
| D | `Amount` | Decimal | Numerical cost value |

## 🔌 API Integration (Apps Script)
The system fetches data via `doGet(e)` which MUST return a JSON array of arrays:
`[["Header1", "Header2"], ["Row1Val1", "Row1Val2"]]`
