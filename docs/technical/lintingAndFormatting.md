# Linting & Formatting Integration Checklist

This checklist outlines all the steps needed to integrate ESLint and Prettier into your project to ensure consistent code quality and formatting.

---

## Overview

- **ESLint**: Lints your code to catch syntax errors and enforce coding standards.
- **Prettier**: Formats your code automatically to maintain a consistent style.
- This checklist will guide you through installing dependencies, creating configuration files, updating package scripts, and verifying the integration.

---

## Step 1: Install Dependencies

- [x] Install ESLint
- [x] Install Prettier
- [x] Install `@typescript-eslint/parser`
- [x] Install `@typescript-eslint/eslint-plugin`
- [x] Install `eslint-config-prettier`
- [x] Install `eslint-plugin-prettier`

_Example command:_

```bash
npm install --save-dev eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier eslint-plugin-prettier
```

## Step 2: Create ESLint Configuration

- [x] Create a file named `.eslintrc.json` at the project root
- [x] Set the parser to `@typescript-eslint/parser`
- [x] Extend the following configurations:
  - `eslint:recommended`
  - `plugin:@typescript-eslint/recommended`
  - `plugin:prettier/recommended`
- [x] Set the environment to Node.js
- [x] Add any additional rules if needed while deferring formatting rules to Prettier

## Step 3: Create Prettier Configuration

- [x] Create a file named `.prettierrc` at the project root
- [x] Define your formatting preferences:
  - [x] Use 2 spaces for indentation
  - [x] Use single quotes
  - [x] Include trailing commas where appropriate
  - [x] Set any other style rules that suit your project

## Step 4: Update package.json Scripts

- [x] Open your `package.json` file
- [x] Add or update the scripts section with the following commands:
  - [x] Linting Script:
    ```json
    "lint": "eslint 'src/**/*.{ts,tsx,js,jsx}'"
    ```
  - [x] Formatting Script:
    ```json
    "format": "prettier --write 'src/**/*.{ts,tsx,js,jsx,json,md}'"
    ```

## Step 5: Verify and Run Locally

- [x] Run the lint script:
  - [x] Execute: `npm run lint`
- [x] Run the format script:
  - [x] Execute: `npm run format`
- [x] Fix any linting errors or formatting issues reported

## Step 6: Future Integration with GitHub Actions (Optional)

- [ ] Create a GitHub Actions workflow file (e.g., `.github/workflows/ci.yml`) that:
  - [ ] Checks out your repository
  - [ ] Sets up the Node.js environment
  - [ ] Runs `npm install` to install dependencies
  - [ ] Executes `npm run lint` and `npm run format` as part of the CI process
- [ ] Test the workflow in a branch before merging to your main branch

## Final Verification

- [x] Ensure all files in the `src` directory are linted and formatted correctly
- [x] Verify that your development workflow includes running the lint and format scripts before pushing new code
- [x] Update your project documentation with instructions on how to use these scripts
