---
title: 优雅地烘焙 Retrofit
date: 2017-04-07 14:19:18
tags:
	- 设计模式
	- 依赖倒置
---

## 前言

将构造 `Retrofit` 时所需要的材料隔离开来，利用**依赖倒置**这个原则，优雅地烘烤出美味的 `Retrofit` 实例。


## 类图

来自《Head First 设计模式》抽象工厂一节中**披萨店卖披萨**的启发，我们也将 `Retrofit` 看做一样商品，来设计它。

![依赖倒置](http://7xsq1h.com1.z0.glb.clouddn.com/%E4%BE%9D%E8%B5%96%E5%80%92%E7%BD%AE.png)

<!-- more -->

### RetrofitWrapper 

我们需要的产品，内部包含了一个 `Retrofit` 的引用。我们将这个类抽象，构造 `Retrofit` 的原料来自另一个抽象类：`RetrofitWrapperFactory`，代码如下：

```java

/**
 * 产品类，包装了一个 Retrofit
 */
public abstract class RetrofitWrapper {

  protected Retrofit mRetrofit;

  public RetrofitWrapper(RetrofitWrapperFactory retrofitWrapperFactory) {

    mRetrofit = new Retrofit.Builder().baseUrl(retrofitWrapperFactory.provideBaseUrl())
        .client(retrofitWrapperFactory.createOkHttpClient()) // 提供 OkHttp 实例
        .addConverterFactory(retrofitWrapperFactory.createGsonConverterFactory()) // 提供 GsonConvertFactory 实例
        .addCallAdapterFactory(retrofitWrapperFactory.createRxJavaCallAdapter()) // 提供RxJavaCallAdapter 的实例
        .build();
  }

  public Retrofit getRetrofit() {

    return mRetrofit;
  }
}

```

### RetrofitWrapperFactory

```java

/**
 * RetrofitWrapper 抽象工厂，提供 RetrofitWrapper 需要的原料
 */
public interface RetrofitWrapperFactory {

  String provideBaseUrl();

  OkHttpClient createOkHttpClient();

  Converter.Factory createGsonConverterFactory();

  CallAdapter.Factory createRxJavaCallAdapter();
}

```

### RetrofitWrapperStore

兜售 `RetrofitWrapper` 的商店，这里商店类还继承了一个 `RetrofitApiProvider` 接口，用来对外暴露创建 `Retrofit Api Service` 的接口。

```java

/**
 * RetrofitWrapper 商店类
 */
public abstract class RetrofitWrapperStore implements RetrofitApiProvider {

  protected abstract RetrofitWrapper createRetrofitWrapper();
}

```

```java

public interface RetrofitApiProvider {

  <T> T provideApi(Class<T> service);
}

```

## 举栗时间

### 具体产品类

```java

public class PeroRetrofitWrapper extends RetrofitWrapper {

  public PeroRetrofitWrapper(RetrofitWrapperFactory retrofitWrapperFactory) {
    super(retrofitWrapperFactory);
  }
}
```

### 具体工厂类

```java

public class PeroRetrofitWrapperFactory implements RetrofitWrapperFactory {

  private static final int DEFAULT_CONNECT_TIME_OUT = 10; // 默认超时时间

  private static final String TEST_SERVER_URL = "http://192.168.199.182:3000";

  @Override public OkHttpClient createOkHttpClient() {

    return new OkHttpClient.Builder().connectTimeout(DEFAULT_CONNECT_TIME_OUT, TimeUnit.SECONDS)
        .addInterceptor(provideHttpLoggingInterceptor())
        .addNetworkInterceptor(provideTokenInterceptor())
        .build();
  }

  private Interceptor provideHttpLoggingInterceptor() {

    HttpLoggingInterceptor httpLoggingInterceptor = new HttpLoggingInterceptor();
    httpLoggingInterceptor.setLevel(HttpLoggingInterceptor.Level.BODY);

    return httpLoggingInterceptor;
  }

  private Interceptor provideTokenInterceptor() {

    return new TokenInterceptor();
  }

  @Override public CallAdapter.Factory createRxJavaCallAdapter() {

    return RxJavaCallAdapterFactory.create();
  }

  @Override public Converter.Factory createGsonConverterFactory() {

    Gson gson =
        new GsonBuilder().registerTypeAdapterFactory(provideParamsAdapterFactory()).create();

    return GsonConverterFactory.create(gson);
  }

  private TypeAdapterFactory provideParamsAdapterFactory() {

    return new ParamsAdapterFactory();
  }

  @Override public String provideBaseUrl() {

    return TEST_SERVER_URL;
  }
}

```

### 具体商店类

```java

public final class PeroRetrofitWrapperStore extends RetrofitWrapperStore {

  private RetrofitWrapper mRetrofitWrapper;

  public PeroRetrofitWrapperStore() {

    mRetrofitWrapper = createRetrofitWrapper();
  }

  private static class SingletonHolder {

    private static final PeroRetrofitWrapperStore sInstance = new PeroRetrofitWrapperStore();
  }

  public static PeroRetrofitWrapperStore getInstance() {

    return SingletonHolder.sInstance;
  }

  @Override protected RetrofitWrapper createRetrofitWrapper() {

    return new PeroRetrofitWrapper(new PeroRetrofitWrapperFactory());
  }

  @Override public <T> T provideApi(Class<T> service) {

    return mRetrofitWrapper.getRetrofit().create(service);
  }
}

```

### 如何调用？

在实际项目中，`PeroRetrofitWrapper` 和 `PeroRetrofitWrapperFactory` 可以作为 `PeroRetrofitWrapperStore` 的静态内部类，从而屏蔽外部可见性。毕竟，现实生活中，我们买披萨也是去**商店**购买，而不会跑到**原料工厂**自己动手造披萨对吧2333。


```java

  // 获取手机验证码
  private void fetchPinCode(final String phoneNum) {

    PeroRetrofitWrapperStore.getInstance()
        .provideApi(PeroApi.UserApi.class)
        .fetchSmsCode(new Params.Builder().put("phoneNumber", phoneNum).create())
        // 省略...
```

## 思考&改进

示例代码里已经将 `RetrofitWrapper` 单例化了，而创建 `Service Api`，其实还是在 `new object`。

```java

@Override public <T> T provideApi(Class<T> service) {

    return mRetrofitWrapper.getRetrofit().create(service);
  }

```

如果有需要，也可以将 `Api Service` 进行单例化。

## 总结

有 `new` 关键字的地方我们就应该谨慎，是否**耦合**得太厉害，是否可以用工厂模式来解耦。当然，因为我的项目里暂时还没有 ` Dagger2`，所以自己动手，实现解耦，如果有 `Dagger2` 的话，就不用这么麻烦了233。





