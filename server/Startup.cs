using System;
using System.IO;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace aspnetcoreapp
{
	public class Startup
	{
		public static void Main(String[] args)
		{
			new WebHostBuilder()
				.UseKestrel()
				.UseContentRoot(Directory.GetCurrentDirectory())
				.UseWebRoot("client")
				.UseStartup<Startup>()
				.UseUrls("http://*:80")
				.Build()
				.Run();
		}

		private IConfiguration _configuration;

		public Startup(IHostingEnvironment hostingEnvironment)
		{
			_configuration = new ConfigurationBuilder()
				.SetBasePath(hostingEnvironment.ContentRootPath)
				.AddApplicationInsightsSettings(developerMode: hostingEnvironment.IsDevelopment())
				.AddUserSecrets(hostingEnvironment)
				.AddEnvironmentVariables()
				.Build();
		}

		public void ConfigureServices(IServiceCollection services)
		{
			services.AddApplicationInsightsTelemetry(_configuration);
		}

		public void Configure(IApplicationBuilder applicationBuilder, IHostingEnvironment hostingEnvironment, ILoggerFactory loggerFactory)
		{
			loggerFactory.AddConsole(minLevel: LogLevel.Warning);

			applicationBuilder.UseApplicationInsightsRequestTelemetry();
			applicationBuilder.UseApplicationInsightsExceptionTelemetry();
			applicationBuilder.UseDefaultFiles();
			applicationBuilder.UseStaticFiles();
		}
	}

	public static class IConfigurationBuilderExtensions
	{
		public static IConfigurationBuilder AddUserSecrets(this IConfigurationBuilder it, IHostingEnvironment hostingEnvironment) => hostingEnvironment.IsDevelopment()
			? it.AddUserSecrets()
			: it;
	}
}
