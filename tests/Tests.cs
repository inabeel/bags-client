﻿using System;
using Microsoft.AspNetCore.Mvc;
using Xunit;
using Zoltu.Bags.Client.Controllers;

namespace Zoltu.Bags.Client.Tests
{
	public class ControllerTests
	{
		[Fact]
		public async void null_path()
		{
			// arrange
			var controller = new HomeController(new BagsApi());

			// act
			var result = await controller.App(null);

			// assert
			var viewResult = Assert.IsType<ViewResult>(result);
			Assert.Equal(expected: "https://bagcupid.com/", actual: viewResult.ViewData["url"] as String);
			Assert.Equal(expected: "website", actual: viewResult.ViewData["type"] as String);
			Assert.Equal(expected: "Bag Cupid", actual: viewResult.ViewData["title"] as String);
			Assert.Equal(expected: "What is your dream bag? Are you having trouble finding it? Let us help you!", actual: viewResult.ViewData["description"] as String);
			Assert.Equal(expected: "https://bagcupid.com/img/logo/bagcupid.png", actual: viewResult.ViewData["image"] as String);
		}

		[Fact]
		public async void valid_product()
		{
			// arrange
			var controller = new HomeController(new BagsApi());

			// act
			var result = await controller.App("product/1");

			// assert
			var viewResult = Assert.IsType<ViewResult>(result);
			Assert.Equal(expected: "https://bagcupid.com/app/product/1", actual: viewResult.ViewData["url"] as String);
			Assert.Equal(expected: "website", actual: viewResult.ViewData["type"] as String);
			Assert.Equal(expected: "Bag Cupid", actual: viewResult.ViewData["title"] as String);
			Assert.Equal(expected: "What is your dream bag? Are you having trouble finding it? Let us help you!", actual: viewResult.ViewData["description"] as String);
			Assert.Equal(expected: "https://images-na.ssl-images-amazon.com/images/I/51Og1-R3JLL.jpg", actual: viewResult.ViewData["image"] as String);
		}
	}
}