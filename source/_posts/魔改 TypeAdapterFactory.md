---
title: 魔改 TypeAdapterFactory
date: 2017-04-09 20:18:13
tags:
	- gson
	- Android
---

## 前言

感慨：Retrofit2 虽好，但是，有时候总感觉 Java 这门语言还是美中不足啊！

## 恼人的问题

想象一下，有这么几个 Api：

```java

// 获取手机验证码
@POST("/user/sms") Observable<ServerResult<SmsCode>> fetchSmsCode(@Body PhoneNum phoneNum);

// 获取 AuthCode
@POST("/authcode") Observable<ServerResult<AuthCode>> fetchAuthCode(@Body SmsCodeAndOtherParams smsCodeAndOtherParams)

```

<!-- more -->

### 为什么很烦呢？

#### 需要起名字

因为需要用 Gson 解析来解析 json，所以我们需要按照 server 返回的 json 来定义我们的**请求体**（被 `@Body` 注解的参数）以及**响应体**。然而，我这人最烦的就是命名了，本来词汇量就匮乏，还要想名字？

#### 需要新建 class

上面两个 Api，我们需要定义 SmsCode、PhoneNum、AuthCode、SmsCodeAndOtherParams 四个类，然后在类里按照 json 的 key 定义对应的成员变量。

#### 调用 Api 的时候，代码好脏啊

我们需要 new 参数，举栗：调用 fetchSmsCode 前，我们需要 `new PhoneNum()` 并且给它的成员变量赋值，当然如果我们是爱干净的好孩子的话可能会用 Builder 模式来做，但是谁来写这么多的 builder 呢？这可是体力活啊


### 解决方案

#### 问个问题，如果是 JS 的话，这段代码该怎么写呢？

我想，大概是这样的：

```javascript
	var smsCode = etchSmsCode({"phoneNumber":"159XXXXXXXX"})
```
哇，真爽，不用新建 class，不用费力想名字，毕竟我们做 POST 请求的时候，只是想 POST 一个匿名的 JsonObject 而已，新建 class 什么的，真的没必要。

#### 理想的 Api 

```java

	/**
     * 获取验证码
     */
    @POST("/user/sms") Observable<Response<ServerResult<Params>>> fetchSmsCode(
        @Body Params params);

    /**
     * 获取 AuthCode
     */
    @POST("/authcode") Observable<Response<ServerResult<Params>>> fetchAuthCode(
        @Body Params params);

```

#### 期望的调用

```java

// 获取验证码
PeroRetrofitWrapperStore.getInstance()
        .provideApi(PeroApi.UserApi.class)
        .fetchSmsCode(new Params.Builder().put("phoneNumber", phoneNum).create())
        // ... 省略若干代码
```

虽然没有 JS 那么简洁，但是看起来已经没有那么恼人了。那么问题来了，该怎么魔改，实现这样的愿望呢？

#### 利用 TypeAdapterFactory 这个接口

如果对我上篇文章有印象的小伙伴可能会留意下这段代码：

```java

@Override public Converter.Factory createGsonConverterFactory() {

    Gson gson =
        new GsonBuilder().registerTypeAdapterFactory(provideParamsAdapterFactory()).create();

    return GsonConverterFactory.create(gson);
  }
```

这段代码里，我创建了一个 `ParamsAdapterFactory` （继承自 TypeAdapterFactory），并注册到了 GsonBuilder 中。那这有什么用呢？其实非常有用，`TypeAdapterFactory` 内部会创建一个 `ParamsAdapter`，接管了 json 的序列化和反序列化！

来看看我们的 `ParamsAdapter` 做了什么？代码不长，挑重要的分析下。因为我们接管了 json 的序列化过程，在执行 POST 请求的时候，`fetchSmsCode(@Body parmas)` 方法里接受的 params 参数就会走这段代码：

```java

    @Override public void write(JsonWriter jsonWriter, Params params) throws IOException {

      if (params == null) {

        jsonWriter.nullValue();
        return;
      }

      jsonWriter.beginObject();

      Map<String, String> map = params.getExtrasMap();

      for (String key : map.keySet()) {

        jsonWriter.name(key);
        jsonWriter.value(map.get(key));
      }

      jsonWriter.endObject();
	}
```

其实也就是序列化过程，最后 params 会转换成我们想要的 `{"phoneNumber":"159XXXXXXX"}` json 格式 ，接下来的事情就交给 Retrofit（像往常一样）。

同理可得，反序列化过程，就是将服务器返回的 json 解析为，我们期望的 params，代码如下：

```java

@Override public Params read(JsonReader jsonReader) throws IOException {

      if (jsonReader.peek() == JsonToken.NULL) {

        jsonReader.nextNull();
        return null;
      }

      Params.Builder builder = new Params.Builder();

      jsonReader.beginObject();

      while (jsonReader.hasNext()) {

        String key = jsonReader.nextName();
        String value = jsonReader.nextString();

        builder.put(key, value);
      }

      jsonReader.endObject();

      return builder.create();
    }
```

反序列化完毕之后，我们就可以从 params 里拿到自己想要的值，例如：`String authCode = params.get("authCode")`，这里的 Params 就相当于一个 Map，事实上它内部确实是用一个 Map<String,String> 来存取键值对的。

```java

public final class Params {

  private Map<String, String> mExtrasMap;

  private Params(Builder builder) {

    mExtrasMap = builder.mExtrasMap;
  }

  public String get(String key) {

    return mExtrasMap.get(key);
  }

  public Map<String, String> getExtrasMap() {

    return mExtrasMap;
  }

  @Override public String toString() {

    return "Params{" + "mExtrasMap=" + mExtrasMap + '}';
  }

  public static class Builder {

    private Map<String, String> mExtrasMap;

    public Builder() {

      mExtrasMap = new HashMap<>();
    }

    public Builder put(String key, String value) {

      mExtrasMap.put(key, value);
      return this;
    }

    public Params create() {

      return new Params(this);
    }
  }
}
```

代码灰常简单，对不对？到这里，魔改原理就差不多解释清楚了。

当然，可能会有人质疑，那 up 你的意思是劳资不用自己费力写 POJO，全用你的 Params 来替代？（如果我回答不是，你会不会一棒子打过来？）

##### 使用场景
这个，我一开始也没提。如果到了不是非常有必要定义 POJO 的时候，比如，你只是想要 POST 一个 phoneNumber 或者 authCode 的时候，真的没必要为此定义 POJO，多累呢！遇到这种情况，能创建一个匿名的 params 就创建呗，**省下来的时间还能陪陪学妹**，何乐而不为！

也有童鞋会说，老板，你把序列化和反序列化全部接管了，如果我没有用你的 Params ，会不会解析异常？（这点我肯定考虑到了好吧，不然菊花肯定都没了）

##### 类型检查

这里我们判断 rawType，如果是 Params 的话，就返回我们的 ParamsAdaper，否则返回 null，表示不支持。

```java

@Override public <T> TypeAdapter<T> create(Gson gson, TypeToken<T> typeToken) {

    Class<T> rawType = (Class<T>) typeToken.getRawType();

    if (Params.class.isAssignableFrom(rawType)) {

      return (TypeAdapter<T>) new ParamsAdapter();
    }

    return null;
  }
```

####  完整的 TypeAdapterFactory 代码

```java

public final class ParamsAdapterFactory
    implements TypeAdapterFactory {

  @Override public <T> TypeAdapter<T> create(Gson gson, TypeToken<T> typeToken) {

    Class<T> rawType = (Class<T>) typeToken.getRawType();

    if (Params.class.isAssignableFrom(rawType)) {

      return (TypeAdapter<T>) new ParamsAdapter();
    }

    return null;
  }

  private static final class ParamsAdapter extends TypeAdapter<Params> {

    @Override public void write(JsonWriter jsonWriter, Params params) throws IOException {

      if (params == null) {

        jsonWriter.nullValue();
        return;
      }

      jsonWriter.beginObject();

      Map<String, String> map = params.getExtrasMap();

      for (String key : map.keySet()) {

        jsonWriter.name(key);
        jsonWriter.value(map.get(key));
      }

      jsonWriter.endObject();
    }

    @Override public Params read(JsonReader jsonReader) throws IOException {

      if (jsonReader.peek() == JsonToken.NULL) {

        jsonReader.nextNull();
        return null;
      }

      Params.Builder builder = new Params.Builder();

      jsonReader.beginObject();

      while (jsonReader.hasNext()) {

        String key = jsonReader.nextName();
        String value = jsonReader.nextString();

        builder.put(key, value);
      }

      jsonReader.endObject();

      return builder.create();
    }
  }
}
```

>PS：灵感来自 [auto-value-factory](https://github.com/rharter/auto-value-gson)。