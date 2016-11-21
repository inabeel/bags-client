using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;

namespace Zoltu.Bags.Client.Controllers
{
	public class HomeController : Controller
	{
		private static readonly Regex productRegex = new Regex(@"product\/(\d+)", RegexOptions.IgnoreCase | RegexOptions.Compiled);
		private static readonly Regex tagRegex = new Regex(@"tags\/(.*?)\/*?$", RegexOptions.IgnoreCase | RegexOptions.Compiled);
		private static readonly Regex minPriceRegex = new Regex(@"minprice\/(\d+)", RegexOptions.IgnoreCase | RegexOptions.Compiled);
		private static readonly Regex maxPriceRegex = new Regex(@"maxprice\/(\d+)", RegexOptions.IgnoreCase | RegexOptions.Compiled);
		private static readonly Regex aboutRegex = new Regex(@"aboutus", RegexOptions.IgnoreCase | RegexOptions.Compiled);

		private readonly BagsApi bagsApi;

		public HomeController(BagsApi bagsApi)
		{
			this.bagsApi = bagsApi;
		}

		[Route("")]
		[Route("app/{*path}")]
		public async Task<IActionResult> App(String path = null)
		{
			MetaViewModel model = new MetaViewModel();
			model.url = "https://bagcupid.com/";
			model.type = "website";
			model.title = "Bag Cupid";
			model.description = "What is your dream bag? Are you having trouble finding it? Let us help you!";
			model.image = "https://bagcupid.com/img/logo/bagcupid.png";

			path = path ?? "";
			var productId = productRegex.Match(path).Groups[1].Value?.TryParseUInt64();
			var tagId = tagRegex.Match(path).Groups[1].Value;
			var minPrice = minPriceRegex.Match(path).Groups[1].Value.TryParseUInt64();
			var maxPrice = maxPriceRegex.Match(path).Groups[1].Value.TryParseUInt64();
			var aboutUs = aboutRegex.Match(path).Success;

			if (productId != null)
			{
				var product = await bagsApi.GetProduct(productId ?? 0);

				model.url = $"https://bagcupid.com/app/{path.TrimStart('/')}";

				if (product?.Images != null && product.Images.Count() > 0)
					model.image = product.Images
						.Aggregate((selectedImage, nextImage) => (nextImage.Priority < selectedImage.Priority) ? nextImage : selectedImage)
						.Large;
			}

			return View("index", model);
		}
	}

	public class MetaViewModel
	{
		public String url { get; set; }
		public String type { get; set; }
		public String title { get; set; }
		public String description { get; set; }
		public String image { get; set; }
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
