# TVA Refactoring Plan

This document outlines a comprehensive, step-by-step approach to refactoring the Time Variance Authority (TVA) project from its current structure to the clean architecture outlined in `folderStructure.md`.

## Overview

The refactoring will transform the current flat structure into a clean architecture with domain-driven design principles:

- **Domain Layer**: Core business logic and entities
- **Application Layer**: Use cases and application services
- **Adapters Layer**: Repository and service adapters
- **Infrastructure Layer**: External API clients and tools
- **Presentation Layer**: Lambda handlers and entry points
- **Shared Layer**: Utilities and constants

## Principles

1. **Incremental Changes**: Each step should be small and testable
2. **Continuous Functionality**: The application should remain functional throughout
3. **One-Way Dependencies**: Dependencies should point inward (domain ← application ← adapters ← infrastructure/presentation)
4. **Clear Separation**: Each layer should have clear responsibilities

## Detailed Refactoring Steps

The refactoring is broken down into 6 major phases, with each phase consisting of smaller, incremental steps.

### Phase 1: Setup and Domain Layer

#### Step 1.1: Create Basic Folder Structure

- Create the main directories according to clean architecture
- Setup shared utilities and constants

#### Step 1.2: Domain Entities

- Create core domain entities (TimeEntry, User, Team)
- Extract from existing code with pure domain logic

#### Step 1.3: Value Objects

- Create value objects (Duration, TimeRange, WorkingHours)
- Ensure immutability and encapsulation

#### Step 1.4: Domain Interfaces

- Define repository interfaces
- Define service interfaces

#### Step 1.5: Domain Services

- Implement time analysis service
- Implement report services

### Phase 2: Application Layer

#### Step 2.1: Application Interfaces

- Define interfaces for external services
- Create DTOs for inputs and outputs

#### Step 2.2: Use Case - Time Analysis

- Implement time analysis use case
- Connect to domain services

#### Step 2.3: Use Case - Daily Report

- Implement daily report generation use case
- Connect to domain services

#### Step 2.4: Use Case - Monthly Report

- Implement monthly report generation use case
- Connect to domain services

#### Step 2.5: Application Services

- Implement report orchestration
- Implement analysis orchestration

### Phase 3: Adapters Layer

#### Step 3.1: Repository Adapters

- Implement Clockify time entry repository
- Implement user and team repositories

#### Step 3.2: Service Adapters - Clockify

- Implement Clockify service adapter
- Connect to application interfaces

#### Step 3.3: Service Adapters - Slack

- Implement Slack notification service
- Connect to application interfaces

#### Step 3.4: Presenters

- Implement report presenters
- Format output for different channels

### Phase 4: Infrastructure Layer

#### Step 4.1: API Clients

- Refactor Clockify client
- Refactor Slack client

#### Step 4.2: Configuration

- Implement configuration loading
- Environment-specific settings

#### Step 4.3: Logging

- Implement logging infrastructure
- Consistent log format

### Phase 5: Presentation Layer

#### Step 5.1: Lambda Handlers

- Create daily report handler
- Create monthly report handler

#### Step 5.2: Connect Layers

- Wire up all layers through dependency injection
- Ensure proper initialization

### Phase 6: Final Integration and Cleanup

#### Step 6.1: Update Entry Points

- Switch to new Lambda handlers
- Verify functionality

#### Step 6.2: Cleanup

- Remove deprecated code
- Update documentation

## Implementation Prompts

Below are the specific prompts for implementing each step of the refactoring plan.

### Phase 1: Setup and Domain Layer

#### Step 1.1: Create Basic Folder Structure

```
Create the basic folder structure for our clean architecture refactoring of the TVA project. Set up the following directory structure:

1. Create these directories:
   - src/domain
   - src/domain/entities
   - src/domain/value-objects
   - src/domain/interfaces
   - src/domain/interfaces/repositories
   - src/domain/interfaces/services
   - src/domain/services
   - src/domain/exceptions
   - src/application
   - src/application/use-cases
   - src/application/interfaces
   - src/application/services
   - src/adapters
   - src/adapters/repositories
   - src/adapters/services
   - src/adapters/presenters
   - src/infrastructure
   - src/infrastructure/api
   - src/infrastructure/config
   - src/infrastructure/logging
   - src/presentation
   - src/presentation/lambda
   - src/shared
   - src/shared/utils
   - src/shared/constants
   - src/shared/types

2. Create a basic index.ts file in each directory with just an export statement to ensure TypeScript recognizes the directories.

3. Create two key shared files:
   - src/shared/constants/TimeConstants.ts - Extract timing constants from the current code
   - src/shared/utils/DateUtils.ts - Create a utility file for date-related functions

Keep all existing code intact - this step just sets up the structure for our refactoring.
```

#### Step 1.2: Domain Entities

```
Create the core domain entities for the TVA project. These should be pure TypeScript classes or interfaces without external dependencies. Extract the domain concepts from the existing code.

1. Create src/domain/entities/TimeEntry.ts:
   - Extract the TimeEntry interface from the current TimeAnalyzer.ts
   - Make it a pure domain entity with properties: id, start, end, description, project, task

2. Create src/domain/entities/User.ts:
   - Extract user concepts from UserConfig.ts
   - Include id, name, email, team, and other essential properties

3. Create src/domain/entities/Team.ts:
   - Extract team concepts from UserConfig.ts
   - Include id, name, and members (references to User entities)

4. Create src/domain/entities/WorkingDay.ts:
   - Represent a working day with date and status (working/holiday)
   - Include methods to check if it's a working day

Make sure these entities are pure domain objects without dependencies on external libraries or frameworks. They should encapsulate business rules related to their own properties.
```

#### Step 1.3: Value Objects

```
Create the value objects for the TVA project. Value objects are immutable objects that model concepts within our domain that don't have an identity.

1. Create src/domain/value-objects/Duration.ts:
   - An immutable representation of a time duration
   - Include methods like fromHours(), fromMinutes()
   - Add operations like add(), subtract()
   - Include comparison methods

2. Create src/domain/value-objects/TimeRange.ts:
   - An immutable representation of a time range with start and end timestamps
   - Include methods to check if ranges overlap
   - Methods to calculate the duration of the range
   - Methods to check if a timestamp is within the range

3. Create src/domain/value-objects/WorkingHours.ts:
   - Represent required working hours, minimum/maximum thresholds
   - Include validation methods

Make sure all value objects are immutable, and all operations return new instances rather than modifying existing ones. Use factory methods for creation.
```

#### Step 1.4: Domain Interfaces

```
Define the core domain interfaces that will abstract away the implementation details of repositories and services.

1. Create src/domain/interfaces/repositories/ITimeEntryRepository.ts:
   - Define methods for retrieving time entries
   - Methods like getEntriesForUserInRange(userId, startDate, endDate)

2. Create src/domain/interfaces/repositories/IUserRepository.ts:
   - Define methods for retrieving user information
   - Methods like getUserById(), getAllUsers(), getEnabledUsers()

3. Create src/domain/interfaces/repositories/ITeamRepository.ts:
   - Define methods for retrieving team information
   - Methods like getTeamById(), getAllTeams(), getUsersByTeam()

4. Create src/domain/interfaces/services/ITimeAnalyzer.ts:
   - Define methods for analyzing time entries
   - Methods like analyzeEntries(), calculateTotalHours()

5. Create src/domain/interfaces/services/IReportGenerator.ts:
   - Define methods for generating reports
   - Methods like generateDailyReport(), generateMonthlyReport()

These interfaces should be focused on domain operations and should not depend on any external frameworks or infrastructure details.
```

#### Step 1.5: Domain Services

```
Implement the domain services that contain the core business logic for the TVA project. These services will implement the domain interfaces and work with domain entities.

1. Create src/domain/services/TimeAnalysisService.ts:
   - Implement the ITimeAnalyzer interface
   - Extract analysis logic from the current TimeAnalyzer.ts
   - Methods to analyze entries for suspicious patterns
   - Calculate total hours, missing hours, etc.

2. Create src/domain/services/DailyReportService.ts:
   - Implement part of the IReportGenerator interface
   - Business logic for daily reports
   - Work with domain entities and value objects

3. Create src/domain/services/MonthlyReportService.ts:
   - Implement part of the IReportGenerator interface
   - Business logic for monthly reports
   - Work with domain entities and value objects

4. Create src/domain/exceptions/TimeAnalysisException.ts:
   - Define domain-specific exceptions
   - Extend Error class with domain context

These services should contain pure business logic and should not depend on any external frameworks or infrastructure. They should depend only on domain entities, value objects, and interfaces.
```

### Phase 2: Application Layer

#### Step 2.1: Application Interfaces

```
Define the application layer interfaces that will bridge the domain layer with external services. These interfaces are abstractions of infrastructure concerns from the application's perspective.

1. Create src/application/interfaces/ITimeTrackingService.ts:
   - Define methods for interacting with time tracking services
   - Methods like getWorkspaces(), getUserInfo(), getTimeEntries()

2. Create src/application/interfaces/INotificationService.ts:
   - Define methods for sending notifications
   - Methods like notifyDailyReport(), notifyMonthlyReport()

3. Create src/application/interfaces/IConfigurationService.ts:
   - Define methods for accessing configuration
   - Methods like getUsers(), getTeams(), getHolidays()

4. Create src/application/use-cases/daily-report/dto/DailyReportInput.ts:
   - Define input data structure for daily report use case
   - Include date, user IDs, etc.

5. Create src/application/use-cases/daily-report/dto/DailyReportOutput.ts:
   - Define output data structure for daily report use case
   - Include report details, user analyses, etc.

6. Create similar DTOs for monthly-report and time-analysis use cases.

These interfaces should be defined in terms of application needs rather than domain concepts. They abstract away the infrastructure details while providing the functionality needed by the application.
```

#### Step 2.2: Use Case - Time Analysis

```
Implement the time analysis use case, which is a central application service that orchestrates domain services to analyze time entries.

1. Create src/application/use-cases/time-analysis/AnalyzeTimeEntriesUseCase.ts:
   - Create a class that represents this use case
   - Inject necessary dependencies (ITimeAnalyzer, repositories)
   - Implement execute() method that takes input DTO and returns output DTO
   - Orchestrate domain services to analyze time entries

2. Make sure to:
   - Extract this logic from the current index.ts
   - Keep domain logic in domain services
   - Use dependency injection for all dependencies
   - Return application-specific DTOs

This use case should coordinate the work between domain services and repositories, translating between domain objects and application DTOs.
```

#### Step 2.3: Use Case - Daily Report

```
Implement the daily report generation use case, which orchestrates domain services to generate daily reports.

1. Create src/application/use-cases/daily-report/GenerateDailyReportUseCase.ts:
   - Create a class that represents this use case
   - Inject necessary dependencies (repositories, ITimeAnalyzer, INotificationService)
   - Implement execute() method that takes input DTO and returns output DTO
   - Orchestrate domain services to generate and send daily reports

2. Make sure to:
   - Extract this logic from the current index.ts
   - Keep domain logic in domain services
   - Use dependency injection for all dependencies
   - Return application-specific DTOs

This use case should handle the flow of getting time entries, analyzing them, generating reports, and sending notifications for the daily report process.
```

#### Step 2.4: Use Case - Monthly Report

```
Implement the monthly report generation use case, which orchestrates domain services to generate monthly reports.

1. Create src/application/use-cases/monthly-report/GenerateMonthlyReportUseCase.ts:
   - Create a class that represents this use case
   - Inject necessary dependencies (repositories, ITimeAnalyzer, INotificationService)
   - Implement execute() method that takes input DTO and returns output DTO
   - Orchestrate domain services to generate and send monthly reports

2. Make sure to:
   - Extract this logic from the current index.ts
   - Keep domain logic in domain services
   - Use dependency injection for all dependencies
   - Return application-specific DTOs

This use case should handle the flow of getting time entries for a month, analyzing them, generating reports with team-based grouping, and sending notifications for the monthly report process.
```

#### Step 2.5: Application Services

```
Implement application services that orchestrate use cases and provide higher-level operations for the presentation layer.

1. Create src/application/services/ReportOrchestrator.ts:
   - Create a class that orchestrates report generation
   - Inject necessary use cases (GenerateDailyReportUseCase, GenerateMonthlyReportUseCase)
   - Implement methods to trigger daily and monthly reports
   - Handle common logic shared between different report types

2. Create src/application/services/AnalysisOrchestrator.ts:
   - Create a class that orchestrates time analysis operations
   - Inject necessary use cases (AnalyzeTimeEntriesUseCase)
   - Implement methods to trigger various types of analyses
   - Handle common logic shared between different analysis operations

These services should provide a simplified interface for the presentation layer and coordinate the execution of use cases.
```

### Phase 3: Adapters Layer

#### Step 3.1: Repository Adapters

```
Implement repository adapters that connect domain interfaces to data sources. These adapters translate between the external data format and domain entities.

1. Create src/adapters/repositories/ClockifyTimeEntryRepository.ts:
   - Implement ITimeEntryRepository interface
   - Inject the Clockify client
   - Translate between Clockify data format and domain TimeEntry entities
   - Implement methods to fetch time entries from Clockify

2. Create src/adapters/repositories/InMemoryUserRepository.ts:
   - Implement IUserRepository interface
   - Use in-memory data from configuration
   - Translate between configuration data and domain User entities
   - Implement methods to fetch user information

3. Create src/adapters/repositories/ConfigBasedTeamRepository.ts:
   - Implement ITeamRepository interface
   - Use in-memory data from configuration
   - Translate between configuration data and domain Team entities
   - Implement methods to fetch team information

These repository adapters should hide the details of data access and format translation, providing domain entities to the application layer.
```

#### Step 3.2: Service Adapters - Clockify

```
Implement the Clockify service adapter that connects to the application layer's ITimeTrackingService interface.

1. Create src/adapters/services/time-tracking/ClockifyService.ts:
   - Implement ITimeTrackingService interface
   - Inject the Clockify client from infrastructure
   - Translate between infrastructure-specific data and application DTOs
   - Implement methods to interact with Clockify API

2. Create src/adapters/services/time-tracking/MockTimeTrackingService.ts:
   - Implement ITimeTrackingService interface
   - Create a mock implementation for testing
   - Return predictable test data

These service adapters should hide the details of the Clockify API, providing a clean interface to the application layer.
```

#### Step 3.3: Service Adapters - Slack

```
Implement the Slack notification service adapter that connects to the application layer's INotificationService interface.

1. Create src/adapters/services/notification/SlackNotificationService.ts:
   - Implement INotificationService interface
   - Inject the Slack client from infrastructure
   - Translate between application DTOs and Slack-specific formats
   - Implement methods to send notifications to Slack

These service adapters should hide the details of the Slack API, providing a clean interface to the application layer for sending notifications.
```

#### Step 3.4: Presenters

```
Implement presenters that format data for different output channels. These presenters transform application output into formats suitable for external systems.

1. Create src/adapters/presenters/SlackDailyReportPresenter.ts:
   - Create a presenter that formats daily reports for Slack
   - Extract formatting logic from the current SlackNotifier.ts
   - Transform application DTOs into Slack message format

2. Create src/adapters/presenters/SlackMonthlyReportPresenter.ts:
   - Create a presenter that formats monthly reports for Slack
   - Extract formatting logic from the current formatters/MonthlyFormatter.ts
   - Transform application DTOs into Slack message format

These presenters should be responsible for formatting data for specific output channels, separating this concern from the application logic.
```

### Phase 4: Infrastructure Layer

#### Step 4.1: API Clients

```
Refactor the API clients to fit into the infrastructure layer. These clients handle the low-level details of API communication.

1. Create src/infrastructure/api/clockify/ClockifyClient.ts:
   - Refactor the current ClockifyClient.ts
   - Focus on HTTP communication details
   - Handle authentication, rate limiting, and error handling
   - Return raw API responses without domain translation

2. Create src/infrastructure/api/clockify/ClockifyMapper.ts:
   - Create a mapper to transform between API models and domain entities
   - Provide utility methods for data conversion

3. Create src/infrastructure/api/slack/SlackClient.ts:
   - Extract Slack API communication from SlackNotifier.ts
   - Focus on HTTP communication details
   - Handle authentication and error handling
   - Return raw API responses without domain translation

4. Create src/infrastructure/api/slack/SlackMapper.ts:
   - Create a mapper to transform between API models and domain entities
   - Provide utility methods for data conversion

These clients should focus on the technical details of API communication without domain knowledge.
```

#### Step 4.2: Configuration

```
Implement configuration management in the infrastructure layer. This provides access to application settings from various sources.

1. Create src/infrastructure/config/ConfigLoader.ts:
   - Create a loader that reads configuration from files or environment
   - Support different environments (development, production, test)
   - Provide typed access to configuration values

2. Create src/infrastructure/config/EnvironmentConfig.ts:
   - Create a specialized configuration class for environment variables
   - Parse and validate environment variables
   - Provide typed access to environment settings

These components should handle the technical details of configuration access, providing a clean interface for the rest of the application.
```

#### Step 4.3: Logging

```
Implement logging infrastructure that provides consistent logging capabilities across the application.

1. Create src/infrastructure/logging/Logger.ts:
   - Create a logger interface and implementation
   - Support different log levels (debug, info, warn, error)
   - Format log messages consistently
   - Support different output destinations

This component should provide a clean interface for logging throughout the application, handling the technical details of log formatting and output.
```

### Phase 5: Presentation Layer

#### Step 5.1: Lambda Handlers

```
Create Lambda handlers that serve as entry points for the application when running in AWS Lambda.

1. Create src/presentation/lambda/DailyReportHandler.ts:
   - Create a Lambda handler for daily reports
   - Parse and validate input from the Lambda event
   - Use application services to handle the request
   - Format the response according to API Gateway requirements

2. Create src/presentation/lambda/MonthlyReportHandler.ts:
   - Create a Lambda handler for monthly reports
   - Parse and validate input from the Lambda event
   - Use application services to handle the request
   - Format the response according to API Gateway requirements

These handlers should be thin adapters that connect AWS Lambda to the application layer, handling the technical details of the Lambda environment.
```

#### Step 5.2: Connect Layers

```
Connect all layers together with dependency injection to create a complete, working application.

1. Create src/presentation/lambda/container.ts:
   - Set up a dependency injection container
   - Register all components from domain, application, adapters, and infrastructure layers
   - Configure dependencies with proper lifetime management
   - Provide a function to create and initialize the container

2. Update both Lambda handlers to use the container:
   - Get necessary services from the container
   - Use those services to handle requests

This step should wire everything together, ensuring that dependencies flow in the correct direction according to clean architecture principles.
```

### Phase 6: Final Integration and Cleanup

#### Step 6.1: Update Entry Points

```
Update the application entry points to use the new architecture while maintaining backward compatibility.

1. Create src/index.ts (new version):
   - Import and re-export the Lambda handlers
   - Provide backward compatibility with the old interface
   - Gradually transition from the old implementation to the new one

2. Update the AWS Lambda configuration to use the new handlers if needed.

This step should ensure a smooth transition from the old architecture to the new one without breaking existing functionality.
```

#### Step 6.2: Cleanup

```
Clean up the codebase by removing deprecated code and updating documentation.

1. Remove old code that has been replaced by the new architecture:
   - Mark old files as deprecated with clear comments
   - Eventually remove them when the new architecture is stable

2. Update package.json:
   - Update build scripts if needed
   - Update dependencies if needed

3. Update README.md and other documentation:
   - Describe the new architecture
   - Provide guidelines for development
   - Update installation and usage instructions

This step should ensure that the codebase is clean and well-documented after the refactoring.
```

## Conclusion

This refactoring plan provides a detailed, step-by-step approach to transforming the TVA project into a clean architecture. By following these steps incrementally, you can ensure that the application remains functional throughout the refactoring process while gradually improving its structure and maintainability.

Each prompt is designed to be self-contained and focused on a specific aspect of the refactoring, making it easier to implement and verify each step before moving on to the next one.
