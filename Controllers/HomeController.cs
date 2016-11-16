using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;
using System.Net.Http;
using System.Net.Http.Headers;
using Newtonsoft.Json;
using System.Dynamic;
using Newtonsoft.Json.Linq;

namespace Zoltu.Bags.Client.Controllers
{
	public class HomeController : Controller
	{
		private static readonly Regex productRegex = new Regex(@"product\/(\d+)", RegexOptions.IgnoreCase | RegexOptions.Compiled);
		private static readonly Regex tagRegex = new Regex(@"tags\/(.*?)\/*?$", RegexOptions.IgnoreCase | RegexOptions.Compiled);
		private static readonly Regex minPriceRegex = new Regex(@"minprice\/(\d+)", RegexOptions.IgnoreCase | RegexOptions.Compiled);
		private static readonly Regex maxPriceRegex = new Regex(@"maxprice\/(\d+)", RegexOptions.IgnoreCase | RegexOptions.Compiled);
		private static readonly Regex aboutRegex = new Regex(@"aboutus", RegexOptions.IgnoreCase | RegexOptions.Compiled);

		// Best practices: https://www.asp.net/web-api/overview/advanced/calling-a-web-api-from-a-net-client
		private static readonly HttpClient client = new HttpClient();

		static HomeController()
		{
			client.BaseAddress = new Uri("https://bags-api.zoltu.com/api/");
			client.DefaultRequestHeaders.Accept.Clear();
			client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
		}

		[Route("")]
		[Route("app/{*path}")]
		public async Task<IActionResult> App(String path = null)
		{
			var url = "https://bagcupid.com/";
			var type = "website";
			var title = "Bag Cupid";
			var description = "What is your dream bag? Are you having trouble finding it? Let us help you!";
			var image = "https://bagcupid.com/img/logo/bagcupid.png";

			if (!String.IsNullOrEmpty(path))
			{
				var productId = productRegex.Match(path).Groups[1].Value?.TryParseUInt64();
				var tagId = tagRegex.Match(path).Groups[1].Value;
				var minPrice = minPriceRegex.Match(path).Groups[1].Value.TryParseUInt64();
				var maxPrice = maxPriceRegex.Match(path).Groups[1].Value.TryParseUInt64();
				var aboutUs = aboutRegex.Match(path).Success;

				if (productId.HasValue)
				{
					var product = await CallApi($"products/{productId}");

					url = $"https://bagcupid.com/{path}";

					if (product?.images != null && product.images.Count > 0)
						image = (string)(((JObject)product)["images"].Aggregate((minItem, nextItem) => (int)minItem["priority"] < (int)nextItem["priority"] ? minItem : nextItem))["large"];
				}
			}

			ViewData["url"] = url;
			ViewData["type"] = type;
			ViewData["title"] = title;
			ViewData["description"] = description;
			ViewData["image"] = image;

			return View("index");
		}

		static async Task<dynamic> CallApi(String path)
		{
			var response = await client.GetAsync(path);

			if (!response.IsSuccessStatusCode)
				return null;

			var content = await response.Content.ReadAsStringAsync();
			return JsonConvert.DeserializeObject(content);
		}
	}

	public static class Extensions
	{
		public static UInt64? TryParseUInt64(this String value)
		{
			UInt64 id = 0;
			return UInt64.TryParse(value, out id) ? id : (UInt64?)null;
		}
	}
}
