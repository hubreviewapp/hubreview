using System.CommandLine;
using System.CommandLine.Builder;
using System.CommandLine.Hosting;
using System.CommandLine.Parsing;
using CS.Core;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CS.CommandLine;

public class Program
{
    public static async Task Main(string[] args) => await BuildCommandLine()
        .UseHost(_ => Host.CreateDefaultBuilder(),
            host =>
            {
                host.ConfigureAppConfiguration((config) =>
                {
                    config.AddCoreConfiguration();
                });

                host.ConfigureLogging((_, logging) => logging.AddFilter("Microsoft", LogLevel.Warning));

                host.ConfigureServices((context, services) =>
                {
                    var coreConfiguration = services.AddCoreConfigurationInstance(context.Configuration);
                    services.AddCoreProjectServices(coreConfiguration);
                });

                UseCommandHandlers(host);
            })
        .UseDefaults()
        .Build()
        .InvokeAsync(args);

    private static CommandLineBuilder BuildCommandLine()
    {
        return new CommandLineBuilder(new Commands.RootCommand());
    }

    private static void UseCommandHandlers(IHostBuilder host)
    {
        //host.UseCommandHandler<Command, Command.CommandHandler>();
    }
}

