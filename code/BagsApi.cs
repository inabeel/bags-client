using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.Text;

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

		public virtual async Task<List<Product>> GetProductsByTags(IEnumerable<String> tags)
		{
			var url = $"products/by_tags?tag_id={String.Join("&tag_id=", tags)}";
			var response = await httpClient.GetAsync(url);

			if (!response.IsSuccessStatusCode)
				return null;

			var content = await response.Content.ReadAsStringAsync();
			return JsonConvert.DeserializeObject<List<Product>>(content);
		}

		public virtual async Task<List<Product.Tag>> GetTags()
		{
			var response = await httpClient.GetAsync("tags");

			if (!response.IsSuccessStatusCode)
				return null;

			var content = await response.Content.ReadAsStringAsync();
			return JsonConvert.DeserializeObject<List<Product.Tag>>(content);
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
			public IEnumerable<Tag> Tags { get; set; }

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

			public class Tag
			{
				[JsonProperty(PropertyName = "id")]
				public UInt32 TagId { get; set; }

				[JsonProperty(PropertyName = "name")]
				public String TagName { get; set; }

				[JsonProperty(PropertyName = "category_id")]
				public String CategoryId { get; set; }

				public bool IsBrand { get { return this.CategoryId.Equals("32aaedcd-505d-4911-66a3-08d37f9e57bd"); } }
				public bool IsStyle { get { return this.CategoryId.Equals("106538be-3ab8-489f-669f-08d37f9e57bd"); } }
			}
		}
	}
}
