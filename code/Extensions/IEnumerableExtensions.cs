using System;
using System.Collections.Generic;
using System.Linq;

namespace Zoltu.Bags.Client.Extensions
{
	public static class IEnumerableExtensions
    {
		public static IEnumerable<TResult> SelectAndSwallowReferenceType<TSource, TResult>(this IEnumerable<TSource> source, Func<TSource, TResult> predicate) where TResult : class
		{
			return source
				.Select(item =>
				{
					try
					{
						return predicate(item);
					}
					catch (Exception)
					{
						return null;
					}
				})
				.Where(item => item != null);
		}

		public static IEnumerable<TResult> SelectAndSwallowValueType<TSource, TResult>(this IEnumerable<TSource> source, Func<TSource, TResult> predicate) where TResult : struct
		{
			return source
				.Select<TSource, TResult?>(item =>
				{
					try
					{
						return predicate(item);
					}
					catch (Exception)
					{
						return null;
					}
				})
				.Where(item => item != null)
				.Select(item => item.Value);
		}
	}
}
