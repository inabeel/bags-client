using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace Zoltu.Bags.Client.Controllers
{
	public class HomeController : Controller
	{
		[Route("")]
		[Route("app")]
		[Route("app/{path}")]
		[Route("app/product/{productId}")]
		public IActionResult App(int productId = 0, string path = null)
		{
			ViewData["url"] = "https://bagcupid.com/";
			ViewData["type"] = "website";
			ViewData["title"] = "Bag Cupid";
			ViewData["description"] = "What is your dream bag? Are you having trouble finding it? Let us help you!";

			return View("index");
		}
	}
}
