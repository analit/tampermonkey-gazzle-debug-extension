// ==UserScript==
// @name         gazzle-debug-extension
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        *://*/app_dev.php/_profiler/*?panel=guzzle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const compose = (...functions) => args => functions.reduceRight((arg, fn) => fn(arg), args)

    const getDocumentElements = (document) => document.querySelectorAll("#collector-content li")

    const getQueryString = (href) => decodeURIComponent(href).split("\n")[0].replace(/^.+\/\?/, "").trim().replace(/ HTTP\/1.1$/, "")

    const getHost = (href) => decodeURIComponent(href).split("\n")[1].replace(/^Host:\s/, "").trim()

    const getSheme = (innerText) => innerText.match(/https?/)[0]

    const createNewElement = (container) => {
        const requestHref = container.getElementsByTagName("a")[0].href
        const newContainer = document.createElement("div")
        newContainer.setAttribute("style", "margin:10px 0;font-family:monospace")
        const ul = document.createElement("ul")

        const list = compose(
            (queryParamsArray) => queryParamsArray.map(queryParam => {
                const li = document.createElement('li')
                li.setAttribute("style", "padding:0")
                li.innerText = queryParam
                return li
            }),
            (queryParamsArray) => queryParamsArray.sort((paramA, paramB) => /cm=/.test(paramB) ? 1 : -1),
            (queryParamsArray) => queryParamsArray.filter((queryParam) => !/login=|password=|format=|mng_auth=/.test(queryParam)),
            (queryParamsString) => queryParamsString.split("&"),
            getQueryString
        )(requestHref)

        const a = document.createElement("a")
        a.setAttribute("target", "__blank")
        a.setAttribute("style", "color:blue")
        a.href = getSheme(container.innerText) + "://" + getHost(requestHref) + "?" + getQueryString(requestHref)
        a.innerText = list[0].innerText;

        list.shift();
        ul.append(...list);
        newContainer.append(a, ul);

        return newContainer;
    }

    const appendNewElements = (containers) => {
        containers.forEach((container) =>
            container.append(createNewElement(container))
        )
    }

    compose(
        appendNewElements,
        getDocumentElements
    )(document)
})();