using CS.Core.Configuration;
using CS.Core.Repositories;
using CS.Core.Services;
using CS.Core.Utilities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NodaTime;
using Npgsql;

namespace CS.Core;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddCoreProjectServices(this IServiceCollection services, CoreConfiguration config)
    {
        services.AddSingleton<IClock>(SystemClock.Instance);

        services.AddSingleton<CoreConfiguration>(config);
        services.AddCoreProjectRepositories(config);
        services.AddCoreProjectServiceClasses();
        return services;
    }

    private static void AddCoreProjectRepositories(this IServiceCollection services, CoreConfiguration config)
    {
        Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;
        Dapper.SqlMapper.AddTypeHandler(new InstantSqlHandler());
        Dapper.SqlMapper.AddTypeHandler(new GenericArrayHandler<string>());

        services.AddNpgsqlDataSource(config.DbConnectionString, builder => builder.UseNodaTime());

        // TODO register repository singletons
    }

    private static void AddCoreProjectServiceClasses(this IServiceCollection services)
    {
        // TODO register scoped services

        services.AddSingleton<IBCryptPasswordHasher, BCryptPasswordHasher>();
    }

    public static IConfigurationBuilder AddCoreConfiguration(this IConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.AddEnvironmentVariables(prefix: "HUBREVIEW_API_");
        return configurationBuilder;
    }

    public static CoreConfiguration AddCoreConfigurationInstance(this IServiceCollection services, IConfiguration configuration)
    {
        var coreConfiguration = new CoreConfiguration();
        configuration.GetSection(nameof(CoreConfiguration)).Bind(coreConfiguration);

        services.AddSingleton(coreConfiguration);
        return coreConfiguration;
    }

    public static CoreConfiguration AddCoreConfigurationInstance(this IServiceCollection services, CoreConfiguration configuration)
    {
        services.AddSingleton(configuration);
        return configuration;
    }
}

