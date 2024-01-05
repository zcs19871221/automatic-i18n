
context: start, end, newStr, childs: context[]

generateNewText:处理childs后，生成newStr，表示【start-end】需要替换的新字符串
如果str为空，则表示不需要替换

模板字符串
    childs: 模板字符串变量
    generateNewText: 避开child替换为newText，连接出来的字符串，如果包含中文，则设置str为i18n.intl.formatMesage(字符串,variable)，否则设置str为空。放到父亲的child里，因为这个可能还会被替换

模板字符串变量
    childs: 模板字符串||字面量
    generateNewText: 有没有child，都返回原始字符串或替代后的字符串,因为模板字符串的没准需要替换这些字符串为Variable的value

Jsx
    childs: JsxExpressionWinJsx|JsxInnterHtml|JsxVirtualBlock
    generateNewText: 
    handleChild: 每个child 执行handleChild处理后，push到root

JsxExpression
    childs: 模板字符串 | Jsx|字面量字符串
    generateNewText: 有没有child，都返回原始字符串或替代后的字符串

JsxExpressionIncludeJsx
    childs: 模板字符串 JsxInnterHtml
    generateNewText: 每个child generateNewText处理后，直接push到根节点的context.child中

JsxVirtualBlock
    childs: JsxExpression
    generateNewText: 
        concat新字符串，child使用nexText，如果生成的textPattern包含中文，直接push到根目录的context.child中。否则结束


