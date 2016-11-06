using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;
using System.Net.Http;
using System.Net.Http.Headers;
using Newtonsoft.Json;

namespace Zoltu.Bags.Client.Controllers
{
	public class HomeController : Controller
	{
		// Best practices
		// https://www.asp.net/web-api/overview/advanced/calling-a-web-api-from-a-net-client
		static HttpClient client = new HttpClient();

		[Route("")]
		[Route("app/{*path}")]
		public IActionResult App(String path = null)
		{
			String url = "https://bagcupid.com/";
			String type = "website";
			String title = "Bag Cupid";
			String description = "What is your dream bag? Are you having trouble finding it? Let us help you!";
			String image = "https://bagcupid.com/img/logo/bagcupid.png";

			if (!String.IsNullOrEmpty(path))
			{
				String ProductId = MatchRegexAndReturnValue(path, @"product\/(\d+)");
				String TagId = MatchRegexAndReturnValue(path, @"tags\/(.*?)\/*?$");
				String MinPrice = MatchRegexAndReturnValue(path, @"minprice\/(\d+)");
				String MaxPrice = MatchRegexAndReturnValue(path, @"maxprice\/(\d+)");
				String aboutUs = MatchRegexAndReturnValue(path, @"aboutus");

				if (string.IsNullOrEmpty(ProductId))
				{
					dynamic product = CallAPI("products/" + ProductId);

					url = "https://bagcupid.com/" + path;
					type = "website";
					title = "Bag Cupid";
					description = "What is your dream bag? Are you having trouble finding it? Let us help you!";
					image = product.images[0].small;
				}
			}

			ViewData["url"] = url;
			ViewData["type"] = type;
			ViewData["title"] = title;
			ViewData["description"] = description;
			ViewData["image"] = image;

			return View("index");
		}

		public String MatchRegexAndReturnValue(String input, String pattern)
		{
			var match = Regex.Match(input, pattern);

			if (match.Success)
			{
				return match.Groups.Count == 1 ? match.Value : match.Groups[1].Value;
			}

			return String.Empty;
		}

		static dynamic CallAPI(String path)
		{
			client.BaseAddress = new Uri("https://bags-api.zoltu.com/api/");
			client.DefaultRequestHeaders.Accept.Clear();
			client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

			var task = client.GetAsync(path);
			task.Wait();

			HttpResponseMessage response = task.Result;
			dynamic obj = null;
			if (response.IsSuccessStatusCode)
			{
				var contentTask = response.Content.ReadAsStringAsync();
				contentTask.Wait();

				obj = JsonConvert.DeserializeObject(contentTask.Result);
			}

			return obj;
		}
	}
}
