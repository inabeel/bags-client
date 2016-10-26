using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace Zoltu.Bags.Client.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            ViewData["url"] = "https://bagcupid.com/";
            ViewData["type"] = "website";
            ViewData["title"] = "Bag Cupid";
            ViewData["description"] = "What is your dream bag? Are you having trouble finding it? Let us help you!";

            return View();
        }

        [Route("app", Name = "app", Order = 0)]
        public IActionResult app()
        {
            ViewData["url"] = "https://bagcupid.com/";
            ViewData["type"] = "website";
            ViewData["title"] = "Bag Cupid";
            ViewData["description"] = "What is your dream bag? Are you having trouble finding it? Let us help you!";

            return View("Index");
        }

        [Route("app/product/{productId}", Name = "product", Order = 0)]
        public IActionResult product(int productId)
        {
            ViewData["url"] = "Muhammad Nabeel";
            ViewData["type"] = "Managing Director";
            ViewData["title"] = "Principal Software Engineer / Technical Lead";
            ViewData["description"] = "Relliks Systems";

            return View("Index");
        }
    }
}
