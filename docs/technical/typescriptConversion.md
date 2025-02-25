# TypeScript Conversion Todo Checklist

## 1. Setup and Environment

- [x] **Create `tsconfig.json`**
  - Target: ES2019 (or later)
  - Module: CommonJS
  - Enable strict type checking (`"strict": true`)
  - Set `"esModuleInterop": true`
  - Specify `"outDir": "./dist"`
  - Enable `"sourceMap": true`
- [x] **Update `package.json` Scripts**
  - Add `"build": "tsc"`
  - Add `"start": "ts-node index.ts"` (or another appropriate command for local testing)
- [x] **Install Dependencies**
  - Install TypeScript and ts-node:  
    `npm install --save-dev typescript ts-node`
  - Install Node.js type definitions:  
    `npm install --save-dev @types/node`
  - Install other necessary packages (e.g., axios, moment)  
    _(Skip adding extra type definitions for Slack if you don't want them)_

## 2. Convert Configuration Files

- [x] **Convert `config/UserConfig.js` to TypeScript**
  - Rename file to `UserConfig.ts`
  - Define minimal interfaces/types for the User object (e.g., `IUser`) if desired, or use basic types
  - Ensure proper import of the JSON file (`users.json`)
- [x] **Verify `config/users.json`**
  - Confirm that it remains unchanged and is correctly referenced

## 3. Convert Service Modules

### 3.1 Analyzers

- [x] **Convert `services/analyzers/BaseAnalyzer.js` to `BaseAnalyzer.ts`**
  - Add type annotations for method parameters and return types
  - Define types for any structured data where needed
- [x] **Convert `services/analyzers/MonthlyAnalyzer.js` to `MonthlyAnalyzer.ts`**
  - Import `BaseAnalyzer.ts` correctly
  - Add type annotations for functions like `analyzeEntries` and `groupByTeam`
  - Define types for analysis results and team groupings as necessary

### 3.2 Formatters

- [x] **Convert `services/formatters/BaseFormatter.js` to `BaseFormatter.ts`**
  - Add type annotations for methods creating Slack block elements
  - For Slack objects, feel free to use `any` (or minimal types) if you prefer not to add extra type definitions
- [x] **Convert `services/formatters/MonthlyFormatter.js` to `MonthlyFormatter.ts`**
  - Import `BaseFormatter.ts` correctly
  - Add type annotations for functions like `formatReport` and `getTeamEmoji`
  - Use minimal types (or `any`) for Slack message blocks to keep things simple

### 3.3 Clients and Notifiers

- [x] **Convert `services/ClockifyClient.js` to `ClockifyClient.ts`**
  - Use axios type definitions for HTTP requests
  - Annotate the request queue, rate limiting logic, and API responses
  - Define clear return types for methods like `getWorkspaces`, `getUserInfo`, and `getTimeEntries`
- [x] **Convert `services/SlackNotifier.js` to `SlackNotifier.ts`**
  - Import Slack WebClient from `@slack/web-api` and use its built-in types, or fallback to `any` if you prefer
  - Add type annotations to methods like `notifyChannel`, `notifyBulk`, and `notifyMonthly`
  - For Slack message blocks, using `any` is acceptable to avoid extra type definitions

### 3.4 Time Analyzer

- [x] **Convert `services/TimeAnalyzer.js` to `TimeAnalyzer.ts`**
  - Import and use `MonthlyAnalyzer.ts` with proper types
  - Add type annotations for functions analyzing time entries and calculating totals
  - Define types for input entries and analysis results where it makes sense

## 4. Convert the Entry Point

- [x] **Convert `index.js` to `index.ts`**
  - Update the Lambda handler to use appropriate TypeScript types for the event and context objects
  - Update all module imports to reference the new `.ts` files
  - Ensure that the logic for processing daily and monthly reports remains unchanged

## 5. Integration and Wiring

- [x] **Update Import Paths**
  - Verify that all paths are updated to reference the new TypeScript files
- [x] **Build the Project**
  - Run `npm run build` (or `tsc`) to compile the project
  - Resolve any type errors or issues that arise during compilation

## 6. Testing and Verification

- [ ] **Module-Level Testing**
  - Test each converted module individually to ensure functionality
- [ ] **Integration Testing**
  - Use local testing tools (e.g., ts-lambda-local-dev) to run the Lambda handler
  - Verify that Slack notifications (daily and monthly reports) work as expected
  - Compare outputs with known working versions to catch any regressions
- [ ] **Full System Run**
  - Run the complete project end-to-end to confirm that all modules work together

## 7. Documentation and Final Cleanup

- [ ] **Update Documentation**
  - Modify README and any other documentation to reflect the new TypeScript setup
- [ ] **Code Cleanup**
  - Remove any unused JavaScript files that have been converted
  - Ensure that all changes are committed with clear commit messages
- [ ] **Final Verification**
  - Confirm that there is no orphaned code and that all functionality is integrated and working as expected
