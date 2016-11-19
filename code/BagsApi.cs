using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace Zoltu.Bags.Client
{
	public class BagsApi
	{
		private readonly HttpClient httpClient = new HttpClient();

		public BagsApi()
		{
			httpClient.BaseAddress = new Uri("https://bags-api.zoltu.com/api/");
			httpClient.DefaultRequestHeaders.Accept.Clear();
			httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
		}

		public virtual async Task<Product> GetProduct(UInt64 productId)
		{
			var response = await httpClient.GetAsync($"products/{productId}");

			if (!response.IsSuccessStatusCode)
				return null;

			var content = await response.Content.ReadAsStringAsync();
			return JsonConvert.DeserializeObject<Product>(content);
		}

		public class Product
		{
			[JsonProperty(PropertyName = "id")]
			public UInt64 Id { get; set; }
			[JsonProperty(PropertyName = "name")]
			public String Name { get; set; }
			[JsonProperty(PropertyName = "price")]
			public UInt64 Price { get; set; }
			[JsonProperty(PropertyName = "images")]
			public IEnumerable<Image> Images { get; set; }
			[JsonProperty(PropertyName = "purchase_urls")]
			public IEnumerable<String> PurchaseUrls { get; set; }

			public class Image
			{
				[JsonProperty(PropertyName = "priority")]
				public UInt32 Priority { get; set; }
				[JsonProperty(PropertyName = "small")]
				public String Small { get; set; }
				[JsonProperty(PropertyName = "medium")]
				public String Medium { get; set; }
				[JsonProperty(PropertyName = "large")]
				public String Large { get; set; }
			}
		}
	}
}
