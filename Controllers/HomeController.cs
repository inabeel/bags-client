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
		private static Regex productRegx = new Regex(@"product\/(\d+)", RegexOptions.IgnoreCase);
		private static Regex tagRegx = new Regex(@"tags\/(.*?)\/*?$", RegexOptions.IgnoreCase);
		private static Regex minPriceRegx = new Regex(@"minprice\/(\d+)", RegexOptions.IgnoreCase);
		private static Regex maxPriceRegx = new Regex(@"maxprice\/(\d+)", RegexOptions.IgnoreCase);
		private static Regex aboutRegx = new Regex(@"aboutus", RegexOptions.IgnoreCase);
		private static HttpClient client = null;

		public HomeController()
		{
			// Best practices: https://www.asp.net/web-api/overview/advanced/calling-a-web-api-from-a-net-client
			client = new HttpClient();
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
				var productMatch = productRegx.Match(path);
				var productId = productMatch.Success ? productMatch.Groups.Count == 1 ? productMatch.Value : productMatch.Groups[1].Value : String.Empty;

				var tagMatch = tagRegx.Match(path);
				var tagId = tagMatch.Success ? tagMatch.Groups.Count == 1 ? tagMatch.Value : tagMatch.Groups[1].Value : String.Empty;

				var minPriceMatch = minPriceRegx.Match(path);
				var minPrice = minPriceMatch.Success ? minPriceMatch.Groups.Count == 1 ? minPriceMatch.Value : minPriceMatch.Groups[1].Value : String.Empty;

				var maxPriceMatch = maxPriceRegx.Match(path);
				var maxPrice = maxPriceMatch.Success ? maxPriceMatch.Groups.Count == 1 ? maxPriceMatch.Value : maxPriceMatch.Groups[1].Value : String.Empty;

				var aboutUsMatch = aboutRegx.Match(path);
				var aboutUs = aboutUsMatch.Success ? aboutUsMatch.Groups.Count == 1 ? aboutUsMatch.Value : aboutUsMatch.Groups[1].Value : String.Empty;

				if (!String.IsNullOrEmpty(productId))
				{
					var product = await CallApi("products/" + productId);

					url = "https://bagcupid.com/" + path;
					type = "website";
					title = "Bag Cupid";
					description = "What is your dream bag? Are you having trouble finding it? Let us help you!";
					image = (product != null && product.images.Count > 0 && product.images[0].large != null) ? product.images[0].large : "";
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

			var contentTask = await response.Content.ReadAsStringAsync();
			return JsonConvert.DeserializeObject(contentTask);
		}
	}
}
