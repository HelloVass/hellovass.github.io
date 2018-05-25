---
title: 优雅地烘焙 DBService
date: 2017-04-21 18:30:05
tags:
	- 设计模式
	- 依赖倒置

---



## 写在最前

<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width=330 height=86 src="//music.163.com/outchain/player?type=2&id=463462465&auto=0&height=66"></iframe>

记得大二那年第一次接触 GreenDao 这个**神奇**的数据库，惊叹道，哇，原来代码还能这么写啊，不用自己手撸 SQLiteDatabase，不用写那些麻烦的 SQL 语句，编程还真是一件 “轻松” 的事情呢2333。然而，时隔多年，当我再次看到自己曾经留在项目里的那段代码时，相顾无言，惟有泪千行...

<!-- more -->

## 自己挖的坑，哭着也要填完

在此，向川神和小飞飞道歉，哈哈，让你们一直用着我当年的拙劣之作，实在抱歉，你们那时候一定很想打死我吧！

### 新的类图，更强的封装

![类图](http://7xsq1h.com1.z0.glb.clouddn.com/greenDao%E5%B0%81%E8%A3%85%E5%90%8E%E7%9A%84%E7%B1%BB%E5%9B%BE.png)

### 目录结构看起来是这样的



![目录结构](http://7xsq1h.com1.z0.glb.clouddn.com/greenDao%E5%B0%81%E8%A3%85%E5%90%8E%E7%9A%84%E7%9B%AE%E5%BD%95%E7%BB%93%E6%9E%84%E5%9B%BE.png)



## 思路

### 数据库版本

greenDao3.x，3.x版本的 greenDao 采用注解+apt 的方式生成 PO（数据持久化对象），和以前的定义 Generator 方式相比，真的简洁了不少。

### 设计模式&法则

- 抽象工厂
- 依赖倒置

## 产品类族

### DBService

仅包含一个 AbsDaoDelegate 的引用，通过建造者模式创建它的实例。源码如下：

```java
public final class DBService<T, K> {

  private AbsDaoDelegate<T, K> mDaoDelegate;

  public DBService(Builder<T, K> builder) {

    mDaoDelegate = builder.mDaoDelegate;
  }

  public AbsDaoDelegate<T, K> getDaoDelegate() {

    return mDaoDelegate;
  }

  public static final class Builder<T, K> {

    private AbsDaoDelegate<T, K> mDaoDelegate;

    public Builder<T, K> setDaoDelegate(AbsDaoDelegate<T, K> daoDelegate) {

      mDaoDelegate = daoDelegate;
      return this;
    }

    private void checkEmptyFields() {

      if (mDaoDelegate == null) {

        throw new IllegalArgumentException("core dao can't be null");
      }
    }

    public DBService<T, K> build() {

      checkEmptyFields();
      return new DBService<>(this);
    }
  }
}
```



注意，DBService 是一个泛型类，泛型 T 代表了我们定义的 PO（数据持久化对象），泛型 K 代表了 PO 的**主键类型**。不要急，稍后会给出如何定义 PO 的栗子。

### AbsDaoDelegate

- 实现了 DataSource 接口，提供了开发中需要的 60% 的方法
- 代理模式，本身不做 CUID 操作，全部交由 greenDao 生成的 XXDao 来完成
- ...

源码如下：

```java
public abstract class AbsDaoDelegate<T, K> implements DataSource<T, K> {

  protected AbstractDao<T, K> mAbstractDao;

  public AbsDaoDelegate(AbstractDao<T, K> abstractDao) {

    mAbstractDao = abstractDao;
  }

  @Override public void add(T data) {

    mAbstractDao.insert(data);
  }

  @Override public void addAll(List<T> dataList) {

    mAbstractDao.insertInTx(dataList);
  }

  @Override public void delete(T data) {

    mAbstractDao.delete(data);
  }

  @Override public void deleteByKey(K k) {

    mAbstractDao.deleteByKey(k);
  }

  @Override public void deleteByKeys(List<K> keyList) {

    mAbstractDao.deleteByKeyInTx(keyList);
  }

  @Override public void deleteByCondition(WhereCondition whereCondition) {

    mAbstractDao.queryBuilder()
        .where(whereCondition)
        .buildDelete()
        .executeDeleteWithoutDetachingEntities();
  }

  @Override public void deleteAll(List<T> dataList) {

    mAbstractDao.deleteInTx(dataList);
  }

  @Override public void update(T t) {

    mAbstractDao.update(t);
  }

  @Override public void updateAll(List<T> dataList) {

    mAbstractDao.updateInTx(dataList);
  }

  @Override public void insertOrReplace(T t) {

    mAbstractDao.insertOrReplace(t);
  }

  @Override public void insertOrReplace(List<T> dataList) {

    mAbstractDao.insertOrReplaceInTx(dataList);
  }

  @Override public T queryByKey(K k) {

    return mAbstractDao.load(k);
  }

  @Override public List<T> queryByPage(int pageNum) {

    return mAbstractDao.queryBuilder().offset(10 * (pageNum - 1)).limit(10).list();
  }

  @Override public List<T> queryByCondition(WhereCondition whereCondition, Property sort) {

    return mAbstractDao.queryBuilder().where(whereCondition).orderDesc(sort).list();
  }

  @Override public List<T> queryAll() {

    return mAbstractDao.loadAll();
  }

  @Override public void clear() {

    mAbstractDao.deleteAll();
  }
}
```



## 工厂类族

### 抽象工厂 DBServiceFactory

- 定义了创建 DBService 的方法，至于如何创建工厂，交给具体工厂（实现了抽象工厂的类）来决定

源码如下：

```java
public interface DBServiceFactory<T, K> {

  DBService<T, K> createDBService();
}
```



### DBServiceStore

- 定义了创建 DBService 的方法，看起来和 DBServiceFactory 有点儿像，但意义不同。商店并不负责造产品，只是根据用户传入的**工厂**来提供对应的产品 DBService，自己并不会负责去造产品。如果是这样的话，那商店未免也太辛苦了不是吗？

源码如下：

```java
public abstract class DBServiceStore {

  public abstract <T, K> DBService<T, K> createDBService(DBServiceFactory<T, K> factory);
}
```



### DBHelper

和 2.x 时代的写法相比并没有太大的区别，这里就直接贴代码了。

```java
public final class DBHelper {

  private static DBHelper sDBHelper;

  private DaoMaster mDaoMaster;

  private DaoSession mDaoSession;

  public static DBHelper getInstance(Context context, String dbName) {

    if (sDBHelper == null) {
      
      sDBHelper = new DBHelper(context, dbName);
    }

    return sDBHelper;
  }

  public DaoSession getDaoSession() {

    return mDaoSession;
  }

  private DBHelper(Context context, String dbName) {

    DaoMaster.DevOpenHelper devOpenHelper =
        new DaoMaster.DevOpenHelper(context.getApplicationContext(), dbName, null);
    mDaoMaster = new DaoMaster(devOpenHelper.getWritableDatabase());
    mDaoSession = mDaoMaster.newSession();
  }
}
```



### PO 定义

也就是类图中 User 的声明，greenDao 3.x 之后，我们可以使用注解来声明一个 PO，然后 build 一下，greenDao 会自动在 greendao 这个包目录（包目录可以根据自己的喜好指定）下生成我们需要的 DaoMaster、DaoSession、UserDao。 私以为，这些由 apt 自动生成的 class ，我们最好不要改动！！！



## 使用

前面讲了这么多，不过是介绍我的封装思路而已，那么实际项目中怎么使用呢？其实写这篇博客也是给自己做备忘2333...

### PeroDBServiceStore

implements 自 DBServiceStore，代表 DBService 商店，我们需要 XXDBService 的时候，只需要调用 createDBService 方法，将具体的工厂 XXDBServiceFactory 作为参数传入即可。

源码如下：

```java
public class PeroDBServiceStore extends DBServiceStore {

  private PeroDBServiceStore() {

  }

  private static class PeroDBServiceStoreSingletonHolder {

    private static final PeroDBServiceStore sInstance = new PeroDBServiceStore();
  }

  public static PeroDBServiceStore getInstance() {

    return PeroDBServiceStoreSingletonHolder.sInstance;
  }

  @Override public <T, K> DBService<T, K> createDBService(DBServiceFactory<T, K> factory) {

    return factory.createDBService();
  }
}
```



## 具体工厂

implements 自 DBServiceFactory，生产具体产品，然后提供给商店，最后提供给我们这些**消费者**。

1. 根据需要定义 PO
2. 根据 PO 定义 XXDaoDelegate
3. 根据 XXDaoDelegate 定义 XXDBService
4. 根据 XXDBService 定义 XXDBServiceFactory

当然，很多时候可以简化，比如：

```java
public class UserDBServiceFactory implements DBServiceFactory<User, String> {

  private UserDBServiceFactory() {

  }

  public static UserDBServiceFactory create() {

    return new UserDBServiceFactory();
  }

  @Override public DBService<User, String> createDBService() {

    return new DBService.Builder<User, String>				   ().setDaoDelegate(provideDaoDelegate()).build();
  }

  private AbsDaoDelegate<User, String> provideDaoDelegate() {

    return new AbsDaoDelegate<User, String>(
        DBHelper.getInstance(App.getInstance(), "pero_db").getDaoSession().getUserDao()) {

    };
  }
}
```

这里，我只定义了一个 UserDBServiceFactory，其它的都是用**匿名对象**实现了。当然，这是为了简化代码，大部分情况下都是可以满足的，毕竟 DataSource 接口定义了很多常用的方法，比如：

```java
public interface DataSource<T, K> {

  void add(T data);

  void addAll(List<T> dataList);

  void delete(T data);

  void deleteByKey(K k);

  void deleteByKeys(List<K> keyList);

  void deleteByCondition(WhereCondition whereCondition);

  void deleteAll(List<T> dataList);

  void update(T t);

  void updateAll(List<T> dataList);

  void insertOrReplace(T t);

  void insertOrReplace(List<T> dataList);

  T queryByKey(K k);

  List<T> queryByPage(int pageNum);

  List<T> queryByCondition(WhereCondition whereCondition, Property sort);

  List<T> queryAll();

  void clear();
}
```

这时候，我们 save 一个 User 的时候可以这么写了：

```java
PeroDBServiceStore.getInstance().createDBService(UserDBServiceFactory.create())
  		.getDaoDelegate()
        .add(user); // save user to db
```



// 因为懒，省略其他的栗子了



## 疑问&解答



### 兄弟，那我需要更骚的操作怎么办？

比如，我需要根据 User 的某个属性（比如用户 Id）来获取数据，怎么破？

### 解答

~~额，这个骚操作，在 DataSource 里确实不怎么好定义（至少我当时没想好）~~，可以破。在 XXDBServiceFactory 里定义 XXDaoDelegate，实现你的骚操作。调用的时候，这么来：

```java
PeroDBServiceStore.getInstance().createDBService(UserDBServiceFactory.create())
  		.getDaoDelegate()
  		.queryByCondition(UserDao.Properties.UserId.eq(userId),UserDao.Properties.createdAt);
```



~~可能不够优雅 233333，总之我看着是有点儿不爽，哪天有空再改改…~~



## 写在最后

五一假期，在空间看到学弟组织了一波钱塘江烧烤+KTV，撸着烤串，唱歌歌，就这么唱出自己的大学人生，仔细想想，就是有这样的骚操作呢！可惜，还是少了几个妹纸啊233333