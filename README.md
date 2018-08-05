# hellovass.github.io
个人博客站点

# 新环境快速构建备忘

## Step1
> git clone git@github.com:HelloVass/hellovass.github.io.git

## Step2
> cd hellovass.github.io
> git submodule update --init --recursive

## Step3
> npm install -g hexo-cli

## Step4
> npm install

## Step5
> npm install hexo-deployer-git –save

## 最后，素质四连完事
> git add ./
> git commit -m "..."
> git push origin hexo
> hexo d
