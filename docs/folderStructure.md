# TVA Refactoring: Folder Structure

This document outlines the proposed folder structure for the refactored Time Variance Authority (TVA) project, following clean architecture principles and SOLID design.

## Root Structure

```
time-variance-authority/
├── src/
│   ├── domain/           # Core business logic and entities
│   ├── application/      # Use cases and application services
│   ├── adapters/         # Adapters for external services
│   ├── infrastructure/   # External frameworks and tools
│   ├── presentation/     # Controllers and entry points
│   └── shared/           # Shared utilities and helpers
├── docs/                 # Documentation
├── scripts/              # Build and deployment scripts
└── config/               # Configuration files
```

## Detailed Structure with Co-located Tests

### Domain Layer

```
src/domain/
├── entities/             # Core business objects
│   ├── TimeEntry.ts
│   ├── TimeEntry.test.ts
│   ├── User.ts
│   ├── User.test.ts
│   ├── Team.ts
│   ├── Team.test.ts
│   ├── WorkingDay.ts
│   └── WorkingDay.test.ts
├── value-objects/        # Immutable value objects
│   ├── Duration.ts
│   ├── Duration.test.ts
│   ├── TimeRange.ts
│   ├── TimeRange.test.ts
│   ├── WorkingHours.ts
│   └── WorkingHours.test.ts
├── interfaces/           # Domain interfaces
│   ├── repositories/
│   │   ├── ITimeEntryRepository.ts
│   │   ├── IUserRepository.ts
│   │   └── ITeamRepository.ts
│   └── services/
│       ├── ITimeAnalyzer.ts
│       └── IReportGenerator.ts
├── services/             # Domain services
│   ├── TimeAnalysisService.ts
│   ├── TimeAnalysisService.test.ts
│   ├── DailyReportService.ts
│   ├── DailyReportService.test.ts
│   ├── MonthlyReportService.ts
│   └── MonthlyReportService.test.ts
└── exceptions/           # Domain-specific exceptions
    ├── TimeAnalysisException.ts
    └── TimeAnalysisException.test.ts
```

### Application Layer

```
src/application/
├── use-cases/            # Application use cases
│   ├── daily-report/
│   │   ├── GenerateDailyReportUseCase.ts
│   │   ├── GenerateDailyReportUseCase.test.ts
│   │   └── dto/
│   │       ├── DailyReportInput.ts
│   │       └── DailyReportOutput.ts
│   ├── monthly-report/
│   │   ├── GenerateMonthlyReportUseCase.ts
│   │   ├── GenerateMonthlyReportUseCase.test.ts
│   │   └── dto/
│   │       ├── MonthlyReportInput.ts
│   │       └── MonthlyReportOutput.ts
│   └── time-analysis/
│       ├── AnalyzeTimeEntriesUseCase.ts
│       ├── AnalyzeTimeEntriesUseCase.test.ts
│       └── dto/
│           ├── TimeAnalysisInput.ts
│           └── TimeAnalysisOutput.ts
├── interfaces/           # Application interfaces
│   ├── ITimeTrackingService.ts
│   ├── INotificationService.ts
│   └── IConfigurationService.ts
└── services/             # Application services
    ├── ReportOrchestrator.ts
    ├── ReportOrchestrator.test.ts
    ├── AnalysisOrchestrator.ts
    └── AnalysisOrchestrator.test.ts
```

### Adapters Layer

```
src/adapters/
├── repositories/         # Repository implementations
│   ├── ClockifyTimeEntryRepository.ts
│   ├── ClockifyTimeEntryRepository.test.ts
│   ├── InMemoryUserRepository.ts
│   ├── InMemoryUserRepository.test.ts
│   ├── ConfigBasedTeamRepository.ts
│   └── ConfigBasedTeamRepository.test.ts
├── services/             # Service implementations
│   ├── time-tracking/
│   │   ├── ClockifyService.ts
│   │   ├── ClockifyService.test.ts
│   │   ├── MockTimeTrackingService.ts
│   │   └── MockTimeTrackingService.test.ts
│   └── notification/
│       ├── SlackNotificationService.ts
│       └── SlackNotificationService.test.ts
└── presenters/           # Presenters for formatting output
    ├── SlackDailyReportPresenter.ts
    ├── SlackDailyReportPresenter.test.ts
    ├── SlackMonthlyReportPresenter.ts
    └── SlackMonthlyReportPresenter.test.ts
```

### Infrastructure Layer

```
src/infrastructure/
├── api/                  # External API clients
│   ├── clockify/
│   │   ├── ClockifyClient.ts
│   │   ├── ClockifyClient.test.ts
│   │   ├── ClockifyMapper.ts
│   │   └── ClockifyMapper.test.ts
│   └── slack/
│       ├── SlackClient.ts
│       ├── SlackClient.test.ts
│       ├── SlackMapper.ts
│       └── SlackMapper.test.ts
├── config/               # Configuration management
│   ├── ConfigLoader.ts
│   ├── ConfigLoader.test.ts
│   ├── EnvironmentConfig.ts
│   └── EnvironmentConfig.test.ts
├── logging/              # Logging infrastructure
│   ├── Logger.ts
│   └── Logger.test.ts
└── persistence/          # Data persistence (if needed)
    ├── FileStorage.ts
    └── FileStorage.test.ts
```

### Presentation Layer

```
src/presentation/
├── lambda/               # AWS Lambda handlers
│   ├── DailyReportHandler.ts
│   ├── DailyReportHandler.test.ts
│   ├── MonthlyReportHandler.ts
│   └── MonthlyReportHandler.test.ts
├── cli/                  # Command-line interface
│   ├── CliController.ts
│   └── CliController.test.ts
└── http/                 # HTTP API (if needed)
    ├── HttpController.ts
    └── HttpController.test.ts
```

### Shared Layer

```
src/shared/
├── utils/                # Utility functions
│   ├── DateUtils.ts
│   ├── DateUtils.test.ts
│   ├── TimeUtils.ts
│   └── TimeUtils.test.ts
├── constants/            # Constants and enums
│   ├── TimeConstants.ts
│   └── AnalysisRules.ts
└── types/                # Shared type definitions
    └── CommonTypes.ts
```

## Integration Tests

```
src/integration-tests/
├── repositories/
│   ├── ClockifyRepositoryIntegration.test.ts
│   └── UserRepositoryIntegration.test.ts
├── services/
│   ├── TimeTrackingServiceIntegration.test.ts
│   └── NotificationServiceIntegration.test.ts
└── e2e/
    ├── DailyReportFlow.test.ts
    └── MonthlyReportFlow.test.ts
```

## Configuration Structure

```
config/
├── default.json          # Default configuration
├── development.json      # Development environment config
├── production.json       # Production environment config
└── test.json             # Test environment config
```

## Implementation Strategy

1. **Start with Domain Layer**: Implement core entities and interfaces first
2. **Build Application Layer**: Implement use cases that orchestrate domain objects
3. **Create Adapters**: Implement adapters for external services
4. **Connect Infrastructure**: Connect to external APIs and services
5. **Build Presentation Layer**: Implement entry points for the application

This structure ensures:

- Clear separation of concerns
- Dependency flow from outer layers to inner layers
- Testability of business logic in isolation
- Flexibility to replace external services
- Scalability for adding new features
- Tests co-located with the code they test
