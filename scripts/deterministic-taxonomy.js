/**
 * 固定每篇文章 tags / categories 的顺序（按名称排序）。
 *
 * Hexo 的 Post.tags 实现是 Tag.find({_id: {$in: ids}})，返回顺序跟着 Tag 表的插入
 * 顺序走，而插入顺序取决于源文件被并发处理完的先后。结果是内容一个字没改，两次构建
 * 出来的 HTML / atom.xml / search.json 里 tag 排列也可能不同——部署流程据此判断
 * “有没有变化”，就会不停产生无意义的提交。
 */
'use strict';

function sortedByName(post, refModel, refField, model) {
  const ids = hexo
    .model(refModel)
    .find({ post_id: post._id }, { lean: true })
    .map((item) => item[refField]);
  return hexo.model(model).find({ _id: { $in: ids } }).sort('name');
}

hexo.model('Post').schema.paths.tags.get(function () {
  return sortedByName(this, 'PostTag', 'tag_id', 'Tag');
});

hexo.model('Post').schema.paths.categories.get(function () {
  return sortedByName(this, 'PostCategory', 'category_id', 'Category');
});
