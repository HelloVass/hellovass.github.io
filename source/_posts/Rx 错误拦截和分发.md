---
title: Rx 错误拦截和分发
date: 2017-04-15 21:57:46
tags:	
	- rxjava
	- 错误分发
---



<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width=330 height=86 src="//music.163.com/outchain/player?type=2&id=434659672&auto=0&height=66"></iframe>

## 前言

> 这感觉已经不对
>
> 我最后才了解
>
> 一页页不忍翻阅
>
> 的情节你好累

这次要做的事是按照业务重构网络层的**错误拦截和分发**，仅以这段歌词献给两位前同事。

<!-- more -->

## 整理下逻辑![错误拦截以及分发](https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/Rx%20%E9%94%99%E8%AF%AF%E6%8B%A6%E6%88%AA%E5%92%8C%E5%88%86%E5%8F%91.png)



## 本次的两个知识点（敲黑板



### onErrorResumeNext 操作符的运用

这个操作符是干嘛的呢？当错误发生时，使用另一个数据流（Observable）继续发射数据，在返回的 Observable 中是看不到错误信息的。利用这个操作符，我们可以实现把**一个异常信息包装起来再次抛出**。



### CallAdapter 的魔改

那在哪里拦截异常，然后重新包装再抛出（分发）呢？

这里先分享下我的好 gay 友 [YoKey](http://www.jianshu.com/u/6b372d09b617) 的[方案](http://www.jianshu.com/p/f3f0eccbcd6f)。youyou 的方案非常简洁，使用一个静态方法，方法里内部根据 server 端返回的 status 来分发错误。调用的时候，就像设置**哨卡**一样，在每个 API 请求的后面带上 `RxResultHelper.handleResult()` 即可（ps:就是遇到请求比较多的时候，需要设置好几个**哨卡**）。



#### 我的方案

其实大体上和 youyou 是如出一辙的，就是设置**哨卡**的地方有点儿不太一样，这里我们再回忆下 API 的形式吧：



```java
	/**
     * 获取验证码
     */
    @POST("/sms") Observable<ServerResult<Params>> fetchSmsCode(@Body Params params);
```



方法调用的返回结果是一个 Observable<ServerResult<Params>，熟悉 Retrofit 的童鞋肯定明白，Retrofit 只能返回一个 ReponseBody，为什么 `ReponseBody ->Observable<ServerResult>` 了呢？



聪明的童鞋肯定知道，这里辛勤的老外盆友替我们做了转换的工作，使我们得到了一个 Observable，这才使流式调用有可能。而转换的地方，那应该是一个**适配器没错了**，看看我们的代码：



```java
mRetrofit = new Retrofit.Builder().baseUrl(retrofitWrapperFactory.provideBaseUrl())
        .client(retrofitWrapperFactory.createOkHttpClient())
        .addConverterFactory(retrofitWrapperFactory.createGsonConverterFactory())
        .addCallAdapterFactory(retrofitWrapperFactory.createRxJavaCallAdapter()) // 设置 CallAdapterFactory
        .build();
```



再仔细想想，这个 CallAdapterFactory 肯定是做了 `ResponseBody -> Observable` 的转换没错了，如果我们能 custom 这个 Factory，我们就能拿到 Observable，如果在这里给它设置一个错误分发器的话，岂不是美滋滋？



### 小课堂

[自定义 CallAdapter](http://www.jianshu.com/p/308f3c54abdd)，可能是因为我用的是最新版的 Retrofit 吧，CallAdapter 的源码已经有些改变了



```java
/**
 * Adapts a {@link Call} with response type {@code R} into the type of {@code T}. Instances are
 * created by {@linkplain Factory a factory} which is
 * {@linkplain Retrofit.Builder#addCallAdapterFactory(Factory) installed} into the {@link Retrofit}
 * instance.
 */
public interface CallAdapter<R, T> {
  /**
   * Returns the value type that this adapter uses when converting the HTTP response body to a Java
   * object. For example, the response type for {@code Call<Repo>} is {@code Repo}. This type
   * is used to prepare the {@code call} passed to {@code #adapt}.
   * <p>
   * Note: This is typically not the same type as the {@code returnType} provided to this call
   * adapter's factory.
   */
  Type responseType();

  /**
   * Returns an instance of {@code T} which delegates to {@code call}.
   * <p>
   * For example, given an instance for a hypothetical utility, {@code Async}, this instance would
   * return a new {@code Async<R>} which invoked {@code call} when run.
   * <pre><code>
   * &#64;Override
   * public &lt;R&gt; Async&lt;R&gt; adapt(final Call&lt;R&gt; call) {
   *   return Async.create(new Callable&lt;Response&lt;R&gt;&gt;() {
   *     &#64;Override
   *     public Response&lt;R&gt; call() throws Exception {
   *       return call.execute();
   *     }
   *   });
   * }
   * </code></pre>
   */
  T adapt(Call<R> call);

  /**
   * Creates {@link CallAdapter} instances based on the return type of {@linkplain
   * Retrofit#create(Class) the service interface} methods.
   */
  abstract class Factory {
    /**
     * Returns a call adapter for interface methods that return {@code returnType}, or null if it
     * cannot be handled by this factory.
     */
    public abstract CallAdapter<?, ?> get(Type returnType, Annotation[] annotations,
        Retrofit retrofit);

    /**
     * Extract the upper bound of the generic parameter at {@code index} from {@code type}. For
     * example, index 1 of {@code Map<String, ? extends Runnable>} returns {@code Runnable}.
     */
    protected static Type getParameterUpperBound(int index, ParameterizedType type) {
      return Utils.getParameterUpperBound(index, type);
    }

    /**
     * Extract the raw class type from {@code type}. For example, the type representing
     * {@code List<? extends Runnable>} returns {@code List.class}.
     */
    protected static Class<?> getRawType(Type type) {
      return Utils.getRawType(type);
    }
  }
}
```

但是，别怕，泛型 R 代表是 ResponseBody，泛型 T 代表最终的转换类型，所以，我们的 CallAdapter 这么写：



```java
private static class RxCallAdapterWrapper<R> implements CallAdapter<R, Observable<?>> {

    private final Retrofit mRetrofit;

    private final CallAdapter<R, ?> mWrappedCallAdapter;
  
  	// ...省略 N 行
```



#### CallAdapterFactory 需要做点儿什么

其实需要做的工作很少：

1. 因为 `ResponseBody -> Observable` 的工作 RxJavaCallAdapterFactory 已经做了，我们也没必要重新造轮子，包装它！
2. 我们需要外部传入一个错误分发器。



```java
public final class RxErrorHandlerCallAdapterFactory extends CallAdapter.Factory {

  private final RxJavaCallAdapterFactory mRxJavaCallAdapterFactory;

  private final RxErrorDispatcher mRxErrorDispatcher;

  private RxErrorHandlerCallAdapterFactory(RxErrorDispatcher errorDispatcher) {

    mRxJavaCallAdapterFactory = RxJavaCallAdapterFactory.create();
    mRxErrorDispatcher = errorDispatcher;
  }
  // 省略 N 行
```



OK，到这里，只需要把最后干活的 CallAdapter 写完，就已经完成大部分工作了，不废话，直接上代码：



```java
private static class RxCallAdapterWrapper<R> implements CallAdapter<R, Observable<?>> {

    private final Retrofit mRetrofit;

    private final CallAdapter<R, ?> mWrappedCallAdapter;

    private final RxErrorDispatcher mRxErrorDispatcher;

    RxCallAdapterWrapper(Retrofit retrofit, CallAdapter<R, ?> wrappedCallAdapter,
        RxErrorDispatcher rxErrorDispatcher) {

      mRetrofit = retrofit;
      mWrappedCallAdapter = wrappedCallAdapter;
      mRxErrorDispatcher = rxErrorDispatcher;
    }

    @Override public Type responseType() {

      return mWrappedCallAdapter.responseType();
    }

  	// 真正的转换在这里
    @SuppressWarnings("unchecked") @Override public Observable<?> adapt(Call<R> call) {

      return ((Observable) mWrappedCallAdapter.adapt(call)).onErrorResumeNext(

          new Func1<Throwable, Observable>() {

            @Override public Observable call(Throwable throwable) {

              return Observable.error(mRxErrorDispatcher.dispatchError(throwable, mRetrofit));
            }
          });
    }
  }
```



我们关注最后一个方法，这里在 `((Observable) mWrappedCallAdapter.adapt(call))` 后，我们已经得到了 Observable，接上我们的 onErrorResumeNext 操作符，至于具体错误如何分发，就交给 mRxErrorDispatcher 吧！



####  RxErrorDispatcher 

只是一个接口而已，具体的分发还是得根据需求来分发：



```java
public interface RxErrorDispatcher {

  Throwable dispatchError(Throwable throwable, Retrofit retrofit);
}
```



参数里为毛还有一个 Retrofit 呢？额，这里，如果你们的后端和 youyou 一样的话，应该是不需要的，而我这里有些历史遗留问题，所以...额



如果你仔细看过开头的流程图的话，会发现，如果错误产生，response.body() 返回的是 null，错误信息需要从 response.errorBody() 里取得，为什么会这样子呢，熟练地丢锅给后端...



![为什么会这样子呢](https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/%E4%B8%BA%E4%BB%80%E4%B9%88%E4%BC%9A%E8%BF%99%E6%A0%B7%E5%AD%90%E5%91%A2.jpg)



```java
private <T> T getErrorBodyAs(Response response, Class<T> type, Retrofit retrofit)
      throws IOException {

    if (response == null || response.errorBody() == null) {

      return null;
    }

    Converter<ResponseBody, T> converter = retrofit.responseBodyConverter(type, new Annotation[0]);

    return converter.convert(response.errorBody());
  }
```



就这样，我多了一段这样的代码来解析**服务器端**返回的错误信息，我能怎么办，我也很绝望啊！



## 写在最后