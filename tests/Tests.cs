using System;
using System.Collections.Generic;
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
		private readonly IEnumerable<Uri> expectedDefaultImage = new[] { new Uri("https://bagcupid.com/img/logo/bagcupid_large.png") };
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
			var viewModel = Assert.IsType<MetaViewModel>(viewResult.Model);

			Assert.Equal(expected: expectedDefaultUrl, actual: viewModel.Url);
			Assert.Equal(expected: expectedDefaultType, actual: viewModel.Type);
			Assert.Equal(expected: expectedDefaultTitle, actual: viewModel.Title);
			Assert.Equal(expected: expectedDefaultDescription, actual: viewModel.Description);
			Assert.Equal(expected: expectedDefaultImage, actual: viewModel.Images);
		}

		[Fact]
		public async void valid_product_from_real_api()
		{
			// arrange
			var expectedImages = new[]
			{
				new Uri("https://images-na.ssl-images-amazon.com/images/I/51Og1-R3JLL.jpg"),
				new Uri("https://images-na.ssl-images-amazon.com/images/I/51s0z9IkJJL.jpg"),
				new Uri("https://images-na.ssl-images-amazon.com/images/I/514B9iKdVeL.jpg"),
				new Uri("https://images-na.ssl-images-amazon.com/images/I/51g91rlbzxL.jpg"),
			};
			var controller = new HomeController(new BagsApi());

			// act
			var result = await controller.App("product/1");

			// assert
			var viewResult = Assert.IsType<ViewResult>(result);
			var viewModel = Assert.IsType<MetaViewModel>(viewResult.Model);

			Assert.Equal(expected: "https://bagcupid.com/app/product/1", actual: viewModel.Url);
			Assert.Equal(expected: expectedDefaultType, actual: viewModel.Type);
			Assert.Equal(expected: "dkny dkny - satchel/handbag/convertible", actual: viewModel.Title);
			Assert.Equal(expected: expectedDefaultDescription, actual: viewModel.Description);
			Assert.Equal(expected: expectedImages, actual: viewModel.Images);
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
			var viewModel = Assert.IsType<MetaViewModel>(viewResult.Model);

			Assert.Equal(expected: "https://bagcupid.com/app/product/987654321", actual: viewModel.Url);
			Assert.Equal(expected: expectedDefaultType, actual: viewModel.Type);
			Assert.Equal(expected: expectedDefaultTitle, actual: viewModel.Title);
			Assert.Equal(expected: expectedDefaultDescription, actual: viewModel.Description);
			Assert.Equal(expected: expectedDefaultImage, actual: viewModel.Images);
		}

		[Fact]
		public async void valid_products_by_single_tag_from_real_api()
		{
			// arrange
			var expectedImages = new[]
			{
				new Uri("https://images-na.ssl-images-amazon.com/images/I/41bMuVElKtL.jpg"),
				new Uri("https://images-na.ssl-images-amazon.com/images/I/51flp21pHcL.jpg"),
				new Uri("https://images-na.ssl-images-amazon.com/images/I/51qV9uIhBVL.jpg"),
				new Uri("https://images-na.ssl-images-amazon.com/images/I/415MwLrPVJL.jpg"),
				new Uri("https://images-na.ssl-images-amazon.com/images/I/5159OKUd8vL.jpg")
			};

			// arrange
			var controller = new HomeController(new BagsApi());

			// act
			var result = await controller.App("tags/190");

			// assert
			var viewResult = Assert.IsType<ViewResult>(result);
			var viewModel = Assert.IsType<MetaViewModel>(viewResult.Model);

			Assert.Equal(expected: "https://bagcupid.com/app/tags/190", actual: viewModel.Url);
			Assert.Equal(expected: expectedDefaultType, actual: viewModel.Type);
			Assert.Equal(expected: expectedDefaultTitle, actual: viewModel.Title);
			Assert.Equal(expected: "Find your perfect adidas handbag!", actual: viewModel.Description);
			Assert.Equal(expected: expectedImages, actual: viewModel.Images);
		}

		[Fact]
		public async void valid_products_by_multiple_tag_from_real_api()
		{
			// arrange
			var expectedImages = new[]
			{
				new Uri("https://images-na.ssl-images-amazon.com/images/I/51flp21pHcL.jpg"),
				new Uri("https://images-na.ssl-images-amazon.com/images/I/51qV9uIhBVL.jpg"),
				new Uri("https://images-na.ssl-images-amazon.com/images/I/415MwLrPVJL.jpg"),
				new Uri("https://images-na.ssl-images-amazon.com/images/I/5159OKUd8vL.jpg"),
				new Uri("https://images-na.ssl-images-amazon.com/images/I/51yPnhzohXL.jpg")
			};

			// arrange
			var controller = new HomeController(new BagsApi());

			// act
			var result = await controller.App("tags/190_303");

			// assert
			var viewResult = Assert.IsType<ViewResult>(result);
			var viewModel = Assert.IsType<MetaViewModel>(viewResult.Model);

			Assert.Equal(expected: "https://bagcupid.com/app/tags/190_303", actual: viewModel.Url);
			Assert.Equal(expected: expectedDefaultType, actual: viewModel.Type);
			Assert.Equal(expected: expectedDefaultTitle, actual: viewModel.Title);
			Assert.Equal(expected: "Find your perfect adidas, flat handbag!", actual: viewModel.Description);
			Assert.Equal(expected: expectedImages, actual: viewModel.Images);
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
			var viewModel = Assert.IsType<MetaViewModel>(viewResult.Model);

			Assert.Equal(expected: "https://bagcupid.com/app/product/1", actual: viewModel.Url);
			Assert.Equal(expected: expectedDefaultType, actual: viewModel.Type);
			Assert.Equal(expected: expectedDefaultTitle, actual: viewModel.Title);
			Assert.Equal(expected: expectedDefaultDescription, actual: viewModel.Description);
			Assert.Equal(expected: expectedDefaultImage, actual: viewModel.Images);
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
							Large = "http://first"
						},
						new BagsApi.Product.Image
						{
							Priority = 5,
							Large = "http://second"
						},
						new BagsApi.Product.Image
						{
							Priority = 50,
							Large = "http://third"
						},
					}
				});
			var controller = new HomeController(mockBagsApi.Object);

			// act
			var result = await controller.App("product/1");

			// assert
			var viewResult = Assert.IsType<ViewResult>(result);
			var viewModel = Assert.IsType<MetaViewModel>(viewResult.Model);

			Assert.Equal(expected: "https://bagcupid.com/app/product/1", actual: viewModel.Url);
			Assert.Equal(expected: expectedDefaultType, actual: viewModel.Type);
			Assert.Equal(expected: expectedDefaultTitle, actual: viewModel.Title);
			Assert.Equal(expected: expectedDefaultDescription, actual: viewModel.Description);
			Assert.Equal(expected: new[] { new Uri("http://second"), new Uri("http://third"), new Uri("http://first") }, actual: viewModel.Images);
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
			var viewModel = Assert.IsType<MetaViewModel>(viewResult.Model);

			Assert.Equal(expected: "https://bagcupid.com/app/product/1", actual: viewModel.Url);
			Assert.Equal(expected: expectedDefaultType, actual: viewModel.Type);
			Assert.Equal(expected: expectedDefaultTitle, actual: viewModel.Title);
			Assert.Equal(expected: expectedDefaultDescription, actual: viewModel.Description);
			Assert.Equal(expected: expectedDefaultImage, actual: viewModel.Images);
		}

		[Fact]
		public async void image_not_a_url()
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
							Large = "http://first"
						},
						new BagsApi.Product.Image
						{
							Priority = 5,
							Large = "http://second"
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
			var viewModel = Assert.IsType<MetaViewModel>(viewResult.Model);

			Assert.Equal(expected: "https://bagcupid.com/app/product/1", actual: viewModel.Url);
			Assert.Equal(expected: expectedDefaultType, actual: viewModel.Type);
			Assert.Equal(expected: expectedDefaultTitle, actual: viewModel.Title);
			Assert.Equal(expected: expectedDefaultDescription, actual: viewModel.Description);
			Assert.Equal(expected: new[] { new Uri("http://second"), new Uri("http://first") }, actual: viewModel.Images);
		}

        [Fact]
        public async void no_tags()
        {
            // arrange
            var mockBagsApi = new Mock<BagsApi>();
            mockBagsApi
                .Setup(x => x.GetTags())
                .ReturnsAsync(null);
            var controller = new HomeController(mockBagsApi.Object);

            // act
            var result = await controller.App("tags/190");

            // assert
            var viewResult = Assert.IsType<ViewResult>(result);
            var viewModel = Assert.IsType<MetaViewModel>(viewResult.Model);

            Assert.Equal(expected: "https://bagcupid.com/app/tags/190", actual: viewModel.Url);
            Assert.Equal(expected: expectedDefaultType, actual: viewModel.Type);
            Assert.Equal(expected: expectedDefaultTitle, actual: viewModel.Title);
            Assert.Equal(expected: expectedDefaultDescription, actual: viewModel.Description);
            Assert.Equal(expected: expectedDefaultImage, actual: viewModel.Images);
        } 
	}
}
