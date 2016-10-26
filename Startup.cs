using System;
using System.IO;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.CodeAnalysis;

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
                       .SetBasePath(hostingEnvironment.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddJsonFile($"appsettings.{hostingEnvironment.EnvironmentName}.json", optional: true)
                .AddEnvironmentVariables()
				.Build();
		}

		public void ConfigureServices(IServiceCollection services)
		{
			services.AddApplicationInsightsTelemetry(_configuration);
            services.AddMvc();

            services.Configure<RazorViewEngineOptions>(options =>
            {
                var previous = options.CompilationCallback;
                options.CompilationCallback = (context) =>
                {
                    previous?.Invoke(context);
                };
            });
        }

		public void Configure(IApplicationBuilder applicationBuilder, IHostingEnvironment hostingEnvironment, ILoggerFactory loggerFactory)
		{
			loggerFactory.AddConsole(minLevel: LogLevel.Warning);

            // custom middleware to re-route all paths starting with `/app` to `/index.html`
            //applicationBuilder.Use(async (context, next) =>
            //{
            //	if (context.Request.Path.StartsWithSegments(new PathString("/app")))
            //		context.Request.Path = new PathString("/index.html");
            //	await next();
            //});

            if (hostingEnvironment.IsDevelopment())
            {
                applicationBuilder.UseDeveloperExceptionPage();
                applicationBuilder.UseBrowserLink();
            }
            else
            {
                applicationBuilder.UseExceptionHandler("/Home/Error");
            }

            applicationBuilder.UseApplicationInsightsRequestTelemetry();
			applicationBuilder.UseApplicationInsightsExceptionTelemetry();
			applicationBuilder.UseDefaultFiles();
			applicationBuilder.UseStaticFiles();

            applicationBuilder.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{id?}");
            });
        }
	}
}
