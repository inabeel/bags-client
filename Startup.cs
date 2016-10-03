using System;
using System.IO;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Zoltu.Bags.Client
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
				.AddApplicationInsightsSettings(developerMode: hostingEnvironment.IsDevelopment())
				.AddEnvironmentVariables()
				.Build();
		}

		public void ConfigureServices(IServiceCollection services)
		{
			services.AddApplicationInsightsTelemetry(_configuration);
			services.AddMvcCore();
		}

		public void Configure(IApplicationBuilder applicationBuilder, IHostingEnvironment hostingEnvironment, ILoggerFactory loggerFactory)
		{
			loggerFactory.AddConsole(minLevel: LogLevel.Warning);

			// custom middleware to re-route all paths starting with `/app` to `/index.html`
			applicationBuilder.Use(async (context, next) =>
			{
				if (context.Request.Path.StartsWithSegments(new PathString("/app")))
					context.Request.Path = new PathString("/index.html");
				await next();
			});
			applicationBuilder.UseApplicationInsightsRequestTelemetry();
			applicationBuilder.UseApplicationInsightsExceptionTelemetry();
			applicationBuilder.UseDefaultFiles();
			applicationBuilder.UseStaticFiles();
		}
	}
}
