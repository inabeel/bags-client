using System;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;
using Zoltu.Bags.Client.Controllers;

namespace Zoltu.Bags.Client.Tests
{
	public class ControllerTests
	{
		private readonly String expectedDefaultType = "website";
		private readonly String expectedDefaultTitle = "Bag Cupid";
		private readonly String expectedDefaultUrl = "https://bagcupid.com/";
		private readonly String expectedDefaultImage = "https://bagcupid.com/img/logo/bagcupid.png";
		private readonly String expectedDefaultDescription = "What is your dream bag? Are you having trouble finding it? Let us help you!";

		[Fact]
		public async void null_path()
		{
			// arrange
			var controller = new HomeController(new BagsApi());

			// act
			var result = await controller.App(null);

			// assert
			var viewResult = Assert.IsType<ViewResult>(result);
			var viewModel = viewResult.Model as MetaViewModel;

			Assert.Equal(expected: expectedDefaultUrl, actual: viewModel.url as String);
			Assert.Equal(expected: expectedDefaultType, actual: viewModel.type as String);
			Assert.Equal(expected: expectedDefaultTitle, actual: viewModel.title as String);
			Assert.Equal(expected: expectedDefaultDescription, actual: viewModel.description as String);
			Assert.Equal(expected: expectedDefaultImage, actual: viewModel.image as String);
		}

		[Fact]
		public async void valid_product_from_real_api()
		{
			// arrange
			var controller = new HomeController(new BagsApi());

			// act
			var result = await controller.App("product/1");

			// assert
			var viewResult = Assert.IsType<ViewResult>(result);
			var viewModel = viewResult.Model as MetaViewModel;

			Assert.Equal(expected: "https://bagcupid.com/app/product/1", actual: viewModel.url);
			Assert.Equal(expected: expectedDefaultType, actual: viewModel.type);
			Assert.Equal(expected: expectedDefaultTitle, actual: viewModel.title);
			Assert.Equal(expected: expectedDefaultDescription, actual: viewModel.description);
			Assert.Equal(expected: "https://images-na.ssl-images-amazon.com/images/I/51Og1-R3JLL.jpg", actual: viewModel.image);
		}

		[Fact]
		public async void invalid_product_from_real_api()
		{
			// arrange
			var controller = new HomeController(new BagsApi());

			// act
			var result = await controller.App("product/987654321");

			// assert
			var viewResult = Assert.IsType<ViewResult>(result);
			var viewModel = viewResult.Model as MetaViewModel;

			Assert.Equal(expected: "https://bagcupid.com/app/product/987654321", actual: viewModel.url);
			Assert.Equal(expected: expectedDefaultType, actual: viewModel.type);
			Assert.Equal(expected: expectedDefaultTitle, actual: viewModel.title);
			Assert.Equal(expected: expectedDefaultDescription, actual: viewModel.description);
			Assert.Equal(expected: expectedDefaultImage, actual: viewModel.image);
		}

		[Fact]
		public async void invalid_product()
		{
			// arrange
			var mockBagsApi = new Mock<BagsApi>();
			mockBagsApi
				.Setup(x => x.GetProduct(It.IsAny<UInt64>()))
				.ReturnsAsync(null);
			var controller = new HomeController(mockBagsApi.Object);

			// act
			var result = await controller.App("product/1");

			// assert
			var viewResult = Assert.IsType<ViewResult>(result);
			var viewModel = viewResult.Model as MetaViewModel;

			Assert.Equal(expected: "https://bagcupid.com/app/product/1", actual: viewModel.url);
			Assert.Equal(expected: expectedDefaultType, actual: viewModel.type);
			Assert.Equal(expected: expectedDefaultTitle, actual: viewModel.title);
			Assert.Equal(expected: expectedDefaultDescription, actual: viewModel.description);
			Assert.Equal(expected: expectedDefaultImage, actual: viewModel.image);
		}

		[Fact]
		public async void multiple_product_images()
		{
			// arrange
			var mockBagsApi = new Mock<BagsApi>();
			mockBagsApi
				.Setup(x => x.GetProduct(It.IsAny<UInt64>()))
				.ReturnsAsync(new BagsApi.Product
				{
					Images = new[]
					{
						new BagsApi.Product.Image
						{
							Priority = 100,
							Large = "first"
						},
						new BagsApi.Product.Image
						{
							Priority = 5,
							Large = "second"
						},
						new BagsApi.Product.Image
						{
							Priority = 50,
							Large = "third"
						},
					}
				});
			var controller = new HomeController(mockBagsApi.Object);

			// act
			var result = await controller.App("product/1");

			// assert
			var viewResult = Assert.IsType<ViewResult>(result);
			var viewModel = viewResult.Model as MetaViewModel;

			Assert.Equal(expected: "https://bagcupid.com/app/product/1", actual: viewModel.url);
			Assert.Equal(expected: expectedDefaultType, actual: viewModel.type);
			Assert.Equal(expected: expectedDefaultTitle, actual: viewModel.title);
			Assert.Equal(expected: expectedDefaultDescription, actual: viewModel.description);
			Assert.Equal(expected: "second", actual: viewModel.image);
		}

		[Fact]
		public async void no_product_images()
		{
			// arrange
			var mockBagsApi = new Mock<BagsApi>();
			mockBagsApi
				.Setup(x => x.GetProduct(It.IsAny<UInt64>()))
				.ReturnsAsync(new BagsApi.Product { Images = new BagsApi.Product.Image[] { } });
			var controller = new HomeController(mockBagsApi.Object);

			// act
			var result = await controller.App("product/1");

			// assert
			var viewResult = Assert.IsType<ViewResult>(result);
			var viewModel = viewResult.Model as MetaViewModel;

			Assert.Equal(expected: "https://bagcupid.com/app/product/1", actual: viewModel.url);
			Assert.Equal(expected: expectedDefaultType, actual: viewModel.type);
			Assert.Equal(expected: expectedDefaultTitle, actual: viewModel.title);
			Assert.Equal(expected: expectedDefaultDescription, actual: viewModel.description);
			Assert.Equal(expected: expectedDefaultImage, actual: viewModel.image);
		}
	}
}
