/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.6.3/workbox-sw.js");

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": "404.html",
    "revision": "29e7cad6d2d40b9b28086b0c3c6bc46c"
  },
  {
    "url": "abduction.svg",
    "revision": "ef6dc31a4fa8384ba0cb717e83863a6e"
  },
  {
    "url": "assets/css/0.styles.30fde923.css",
    "revision": "067d76da0a8425479728022fc120255f"
  },
  {
    "url": "assets/fonts/hack-regular.3eccb984.woff2",
    "revision": "3eccb984a54973a75212391b6d117ace"
  },
  {
    "url": "assets/fonts/hack-regular.b038bd31.woff",
    "revision": "b038bd31fef76bc622d123ae8892efa2"
  },
  {
    "url": "assets/fonts/ktquez.06665560.eot",
    "revision": "066655605108d4a0ae74dcc69bbe7547"
  },
  {
    "url": "assets/fonts/ktquez.87607358.woff",
    "revision": "876073588156b8e621394e0705ed0695"
  },
  {
    "url": "assets/fonts/ktquez.9d97d905.ttf",
    "revision": "9d97d905fd7b9fc68d637ac83de00744"
  },
  {
    "url": "assets/img/ktquez.87f9d450.svg",
    "revision": "87f9d450e4ce8f1d445f17b1cb0a4e6a"
  },
  {
    "url": "assets/js/1.ad891ab2.js",
    "revision": "fa61219c95cf1683a70d900a5a15ada3"
  },
  {
    "url": "assets/js/10.53c2de7f.js",
    "revision": "5b7171e24842ed802f332c047a424596"
  },
  {
    "url": "assets/js/11.f09146f4.js",
    "revision": "cd55628217f5085a79fc9d38e4e2246d"
  },
  {
    "url": "assets/js/12.65dcbfe4.js",
    "revision": "222ca979162ca165e3ebf7a259a7a5bb"
  },
  {
    "url": "assets/js/13.55eda691.js",
    "revision": "aff9f8b49a12ce381f67fc2ce446dc8a"
  },
  {
    "url": "assets/js/14.4f1e9b0f.js",
    "revision": "06ce74e06ca5fde88322af352698b46b"
  },
  {
    "url": "assets/js/15.a99f6f88.js",
    "revision": "bc71cd57df5fbc552fdede0e23a7f457"
  },
  {
    "url": "assets/js/16.6d66cec7.js",
    "revision": "fe881148924f68be2df4296def69b957"
  },
  {
    "url": "assets/js/17.96bf686c.js",
    "revision": "af3d849589dbb07f5c9f6242feb17e5b"
  },
  {
    "url": "assets/js/18.1e0578b5.js",
    "revision": "eccdc7ca702316112cff0ff2780f6f23"
  },
  {
    "url": "assets/js/19.f2427c1c.js",
    "revision": "90c5f02eb453c908b9041455376f89f7"
  },
  {
    "url": "assets/js/2.d393d293.js",
    "revision": "31b9a659d5edf0d69ceb7afd080f065d"
  },
  {
    "url": "assets/js/20.19217737.js",
    "revision": "5c36cd31b9711f6cbdfaf54607924f67"
  },
  {
    "url": "assets/js/21.fa4651e2.js",
    "revision": "da21586934c8839e52b902ac9f63b400"
  },
  {
    "url": "assets/js/22.c1ff8efe.js",
    "revision": "8624bf4a38d1aaa3c2489a17296f6ccd"
  },
  {
    "url": "assets/js/23.1109bf95.js",
    "revision": "722e2d87e4913776c049f95d7c6f8f72"
  },
  {
    "url": "assets/js/24.c9f3506f.js",
    "revision": "3632b522fc2b490607b60dc1e21d1c87"
  },
  {
    "url": "assets/js/25.df84b72c.js",
    "revision": "6c7048ad7b9fb321f623fc2a311ded62"
  },
  {
    "url": "assets/js/26.a49b5b6d.js",
    "revision": "143a541de1f6480f9b8cc5e1a52a3dac"
  },
  {
    "url": "assets/js/27.a04f993f.js",
    "revision": "98d5d81470f9525c3f94e513cf3758ff"
  },
  {
    "url": "assets/js/28.a268e3be.js",
    "revision": "16c7eaa0b1dabcb4891f6afd68833cd8"
  },
  {
    "url": "assets/js/29.6ddbb99b.js",
    "revision": "5422df4027456417ab12ab17991d28b5"
  },
  {
    "url": "assets/js/3.8d7d6cbf.js",
    "revision": "0d344a0319d54ac23fe1986a5d22045a"
  },
  {
    "url": "assets/js/30.3d3388c3.js",
    "revision": "872854244255bb05bd8eb10008376b27"
  },
  {
    "url": "assets/js/31.1f2d60d6.js",
    "revision": "2499c4eff7f5e97765f9a67556cd6104"
  },
  {
    "url": "assets/js/32.6da69397.js",
    "revision": "0c9a9357d3556d03c2c25bc70190b5de"
  },
  {
    "url": "assets/js/33.3a03b0e1.js",
    "revision": "9a04fdb73186e4cca99fb90a9860e31a"
  },
  {
    "url": "assets/js/34.0f215ae5.js",
    "revision": "58f6bf3ab15244ff3e83aa7351cccab6"
  },
  {
    "url": "assets/js/35.66cc025e.js",
    "revision": "34e8f749fa36cbb64850b9fa6db99704"
  },
  {
    "url": "assets/js/36.d61f6bdc.js",
    "revision": "03b8d87a106a4309a34c949d4a290d68"
  },
  {
    "url": "assets/js/37.c132a424.js",
    "revision": "db568756c50856df8735b1e2230cd17f"
  },
  {
    "url": "assets/js/38.4058a6e2.js",
    "revision": "9230f6ab90b45441901252310ba04c68"
  },
  {
    "url": "assets/js/39.5834d9f1.js",
    "revision": "ef8586c754a6b58d2a408ffb6e4d1a96"
  },
  {
    "url": "assets/js/4.6a2c65f2.js",
    "revision": "4508e1f32f2a1407e8a6a7c5b47c6b2e"
  },
  {
    "url": "assets/js/40.a46bf958.js",
    "revision": "d40731b4a6ec7fb099aaf44b6d46f579"
  },
  {
    "url": "assets/js/41.49eba363.js",
    "revision": "7cc2a3d54d2b1a5aaae33ad9acd3539f"
  },
  {
    "url": "assets/js/42.80be6c38.js",
    "revision": "74de1c418afd73d9fbc65539e12038e2"
  },
  {
    "url": "assets/js/43.3520c984.js",
    "revision": "9b547a3f9eb72dd4ece389701add0d5b"
  },
  {
    "url": "assets/js/44.cff176c7.js",
    "revision": "5753f57422de9b25478e24e8849adf3f"
  },
  {
    "url": "assets/js/45.32b06ecf.js",
    "revision": "2374db2ed332f2e58aa668503a6d3ae8"
  },
  {
    "url": "assets/js/46.112286e2.js",
    "revision": "f931f20890e2414cd36ec229ce870b1e"
  },
  {
    "url": "assets/js/47.92001aba.js",
    "revision": "910666af1376e8ddf505b82b0c29d1e9"
  },
  {
    "url": "assets/js/48.1ec45731.js",
    "revision": "876c36bc6fe661518058da39307c788f"
  },
  {
    "url": "assets/js/49.9a638a63.js",
    "revision": "80b758f463ca86501badb307cb67ac96"
  },
  {
    "url": "assets/js/5.37c335c0.js",
    "revision": "450c68bb337fcffe9b216c622454bbb7"
  },
  {
    "url": "assets/js/50.66ffb328.js",
    "revision": "bafced96a442db00af53140741067280"
  },
  {
    "url": "assets/js/51.e459aa96.js",
    "revision": "43f346e0b4f6bb911d9a3565e6ef5234"
  },
  {
    "url": "assets/js/52.c22d259a.js",
    "revision": "0295fec5114a8a72e01aa8787747aac0"
  },
  {
    "url": "assets/js/53.1b1b31a3.js",
    "revision": "7da5d9c3248c068b7c8fb5bb0088c956"
  },
  {
    "url": "assets/js/54.6b35fbf4.js",
    "revision": "2ae84db31d7df2c7c753b11ade268a70"
  },
  {
    "url": "assets/js/55.edc18fab.js",
    "revision": "42e71d33415051a71f5c627567405843"
  },
  {
    "url": "assets/js/56.74bcf650.js",
    "revision": "926f744556263c37efe701551c85e57d"
  },
  {
    "url": "assets/js/57.6eb273c7.js",
    "revision": "a97595898a033ce3e72bba7bd401cd1e"
  },
  {
    "url": "assets/js/58.4ef1a1b3.js",
    "revision": "2979a6b0a44150037e927f1dc44541af"
  },
  {
    "url": "assets/js/59.2ecb3b30.js",
    "revision": "82fefdfb8bce87beccfe5d626ba381d3"
  },
  {
    "url": "assets/js/6.de1c98c6.js",
    "revision": "5fec4c19e94b1f5f086dd4dde7bb8a96"
  },
  {
    "url": "assets/js/60.a1d67f14.js",
    "revision": "65572f7cb8341bbeb00e8763aec25ce8"
  },
  {
    "url": "assets/js/61.effdc360.js",
    "revision": "055cdaf5b9c73380177ea916286dee9e"
  },
  {
    "url": "assets/js/62.47d1d7c7.js",
    "revision": "ac6fe70577e2e648b4b79a4818bbf1fa"
  },
  {
    "url": "assets/js/63.433ad7c9.js",
    "revision": "929f4ebddd793e58c91f17d4cc18fc3c"
  },
  {
    "url": "assets/js/64.8c8bf4fa.js",
    "revision": "9982d531bb87e569d430b45fd13cd92a"
  },
  {
    "url": "assets/js/65.a10b6ac6.js",
    "revision": "462856ed40cb61d8d6d6ee91525e989f"
  },
  {
    "url": "assets/js/66.e1641c1a.js",
    "revision": "924d339a70ee9a2f2b3f3d7e76d85aea"
  },
  {
    "url": "assets/js/67.70ffb2f3.js",
    "revision": "e43c129766b3029776aed8d07c79dc51"
  },
  {
    "url": "assets/js/68.33096323.js",
    "revision": "35475e61fa86c95bcc2de829cf37963e"
  },
  {
    "url": "assets/js/69.55f73847.js",
    "revision": "452da075d8b8f8da92fefede0ed8966b"
  },
  {
    "url": "assets/js/7.1a6b2201.js",
    "revision": "a98d728a45dfc25a61e66632b049dcbb"
  },
  {
    "url": "assets/js/70.ec2fdf2c.js",
    "revision": "d4ca364d71dc1df076407fee4d22f858"
  },
  {
    "url": "assets/js/71.e4a8416e.js",
    "revision": "0afcc4ca6df8090ed5574265ced305ca"
  },
  {
    "url": "assets/js/72.cb3d5428.js",
    "revision": "8f1b126c8ae8f30fa110a7a5859cae59"
  },
  {
    "url": "assets/js/73.aa97641d.js",
    "revision": "81f768772447c85f233b104e41089fc4"
  },
  {
    "url": "assets/js/9.7bb8a970.js",
    "revision": "2a10d690d8b55d2b9edae6b423561fc9"
  },
  {
    "url": "assets/js/app.19063f24.js",
    "revision": "86659b0bbcb861f1b03154bc3802911f"
  },
  {
    "url": "categories/cloud-gaming/index.html",
    "revision": "5f2c86a0c706e0b6af1c9401b274b8bc"
  },
  {
    "url": "categories/development/index.html",
    "revision": "0679b871118b78113cb5976e557b8937"
  },
  {
    "url": "categories/free-game/index.html",
    "revision": "8f181877edaafd90d4015e4fdfd0338a"
  },
  {
    "url": "categories/game-development/index.html",
    "revision": "6b2ad84ea55911efcdf1bdd852a3f9d0"
  },
  {
    "url": "categories/game/index.html",
    "revision": "e31695ca75ac06b13e47a900a4ef4653"
  },
  {
    "url": "categories/index.html",
    "revision": "93661d1ec78996709154a36f1404634a"
  },
  {
    "url": "categories/learning/index.html",
    "revision": "237fbe55d0ef7592887cf1597e5fed96"
  },
  {
    "url": "categories/news/index.html",
    "revision": "0f7747b7685a5a47f03f610dcbb9586f"
  },
  {
    "url": "categories/technology/index.html",
    "revision": "837c6795b7d2f87076284a762cac731c"
  },
  {
    "url": "contact/index.html",
    "revision": "657050b38fa53b5c8a6a5639f76ff134"
  },
  {
    "url": "elite-gamer-logo.png",
    "revision": "c489bcd8295fb1e36df6b9d6494db22b"
  },
  {
    "url": "elite-gamer-logo@2x.png",
    "revision": "d7caea933a59d9bc4965bf043727de9d"
  },
  {
    "url": "fallback.png",
    "revision": "5f03fc301a31248e3859493fefe8c720"
  },
  {
    "url": "favicon/android-chrome-192x192.png",
    "revision": "404b0d230e505c71b5b91eff1f5034a5"
  },
  {
    "url": "favicon/android-chrome-512x512.png",
    "revision": "064d505d8366d99c5424a9e78abae836"
  },
  {
    "url": "favicon/android-icon-144x144.png",
    "revision": "64e3ed640755161dd7f66e4be3aed376"
  },
  {
    "url": "favicon/android-icon-192x192.png",
    "revision": "d098b815fb138cce25c85b369fa12810"
  },
  {
    "url": "favicon/android-icon-36x36.png",
    "revision": "172f51c3bbc37f4e12b06d4b96d4de8d"
  },
  {
    "url": "favicon/android-icon-48x48.png",
    "revision": "24ddebc09e2b2ee5154943bda6b02323"
  },
  {
    "url": "favicon/android-icon-72x72.png",
    "revision": "0dcec991309b8610693eba6df2498e3c"
  },
  {
    "url": "favicon/android-icon-96x96.png",
    "revision": "d0a6ec9bd83a6e2c143b38fee0a76a60"
  },
  {
    "url": "favicon/apple-icon-114x114.png",
    "revision": "f919bcda2492191e28670aa5dd99d43a"
  },
  {
    "url": "favicon/apple-icon-144x144.png",
    "revision": "64e3ed640755161dd7f66e4be3aed376"
  },
  {
    "url": "favicon/apple-icon-57x57.png",
    "revision": "29b91d0ee018b5848cb60561bab002ff"
  },
  {
    "url": "favicon/apple-icon-72x72.png",
    "revision": "0dcec991309b8610693eba6df2498e3c"
  },
  {
    "url": "favicon/apple-icon-precomposed.png",
    "revision": "28ec803ffa81d658a5b22b29c928b813"
  },
  {
    "url": "favicon/apple-touch-icon-120x120.png",
    "revision": "f1cd62e99996605aa3d37dfd5d8f6771"
  },
  {
    "url": "favicon/apple-touch-icon-152x152.png",
    "revision": "f442da862d9bbc6d737224622fbb66dd"
  },
  {
    "url": "favicon/apple-touch-icon-180x180.png",
    "revision": "06c3a0ccc59cd7225b027ba68be24468"
  },
  {
    "url": "favicon/apple-touch-icon-60x60.png",
    "revision": "7812681c192a68ac228eb710116c09d1"
  },
  {
    "url": "favicon/apple-touch-icon-76x76.png",
    "revision": "056d173531dd317e90f640e99b95ae6a"
  },
  {
    "url": "favicon/apple-touch-icon.png",
    "revision": "28ec803ffa81d658a5b22b29c928b813"
  },
  {
    "url": "favicon/favicon-16x16.png",
    "revision": "47bc544a112ef9dd3a65c0895e830948"
  },
  {
    "url": "favicon/favicon-32x32.png",
    "revision": "ecdf295b4bd70ec2fbaa9f34e4db0c69"
  },
  {
    "url": "favicon/favicon-96x96.png",
    "revision": "d0a6ec9bd83a6e2c143b38fee0a76a60"
  },
  {
    "url": "favicon/ms-icon-144x144.png",
    "revision": "64e3ed640755161dd7f66e4be3aed376"
  },
  {
    "url": "favicon/ms-icon-150x150.png",
    "revision": "0b94ed1ee5e31ae95a81ca7f171110c5"
  },
  {
    "url": "favicon/ms-icon-310x310.png",
    "revision": "a5f9d3d0ef30f708a3b5670d229c6b87"
  },
  {
    "url": "favicon/ms-icon-70x70.png",
    "revision": "3ba021cf7ff8de1e1056a3717a1475c4"
  },
  {
    "url": "favicon/mstile-150x150.png",
    "revision": "2bef3a05023d79eec29ecbf48f831754"
  },
  {
    "url": "favicon/safari-pinned-tab.svg",
    "revision": "25726e43c8c005806e85405b9683c369"
  },
  {
    "url": "image-social-share.png",
    "revision": "ebdd0db58e4d48e6bc8686447fb501ed"
  },
  {
    "url": "index.html",
    "revision": "dc8aa886a2fb6d4d69d5465833129006"
  },
  {
    "url": "posts/a-new-trailer-has-arrived-from-hogwarts-legacy-showing-dragons-giant-spiders-and-more/index.html",
    "revision": "d5d3ce14255ab14101234b904630a661"
  },
  {
    "url": "posts/amazon-prime-gaming-is-starting-off-the-new-year-with-a-bang/index.html",
    "revision": "1b4ef464aa766e49dd198fe5ca4ede5a"
  },
  {
    "url": "posts/call-of-duty-vanguard-confession-months-after-activision/index.html",
    "revision": "2659ab0a8ed430762c7d1d18ff774c03"
  },
  {
    "url": "posts/cloud-gaming/index.html",
    "revision": "7c6e958722cbb6c5b419b9fb4ec4b806"
  },
  {
    "url": "posts/december-free-game-news/index.html",
    "revision": "e6b26d2ab72d125231c9ecd0168be6be"
  },
  {
    "url": "posts/endless-games-you-wont-be-able-to-put-down-for-hundreds-of-hours/index.html",
    "revision": "e064944277567ac6a7a6c85970b5e121"
  },
  {
    "url": "posts/epic-games-acquires-rock-band-developer-harmonix/index.html",
    "revision": "d94ece42341351835af1c6a7e2aa145b"
  },
  {
    "url": "posts/epic-games-gives-free-games-daily/index.html",
    "revision": "e40e398370c0d0680e627a45231bfe05"
  },
  {
    "url": "posts/fifa-broke-with-ea-it-will-improve-its-own-game/index.html",
    "revision": "aa7338ce278a661eceefda546a5e5cf3"
  },
  {
    "url": "posts/final-fantasy-16-s-producer-s-statement-that-will-anger-fans-if-you-re-going-to-play-the-game-buy-a-ps5/index.html",
    "revision": "4c6c70c62c4153a9651a054da35acf50"
  },
  {
    "url": "posts/free-dead-space-2-deal-from-ea/index.html",
    "revision": "9c84f17408a81c4729545097a9bb3456"
  },
  {
    "url": "posts/game-development/index.html",
    "revision": "6e445a384035624a80e7ce32f6bdd36c"
  },
  {
    "url": "posts/geforce-now-library-is-expanding-8-new-games-added-to-the-list/index.html",
    "revision": "43317e56422a3a5ff94069cea1240b1f"
  },
  {
    "url": "posts/good-news-for-lord-of-the-rings-fans-from-electronic-arts/index.html",
    "revision": "464a55ae8141fbf51068f6a022481206"
  },
  {
    "url": "posts/grand-opening/index.html",
    "revision": "f2226c69d917cd1ff0736641c70d57cd"
  },
  {
    "url": "posts/gta-trilogy-criticized/index.html",
    "revision": "107878edf0aebb1d429f4f12c8c06246"
  },
  {
    "url": "posts/hogwarts-legacy-becomes-the-best-selling-game-on-steam-before-its-release/index.html",
    "revision": "afe87580128a3af2fc396ac8143d2dc2"
  },
  {
    "url": "posts/index.html",
    "revision": "01fe3107c20cede7b319b6f5ddd36eb0"
  },
  {
    "url": "posts/msi-is-unhappy-with-nvidias-pricing-it-recommends-the-4070-ti-instead-of-the-4080/index.html",
    "revision": "9373b9776c1c6e2df6dcdc9000e9a486"
  },
  {
    "url": "posts/netease-is-not-sleeping-now-it-has-acquired-skybox-labs-the-co-developer-of-halo-infinite/index.html",
    "revision": "645ecc83807e42ed1084f4ef4be8ebaa"
  },
  {
    "url": "posts/new-gameplay-video-of-skull-and-bones-has-been-released/index.html",
    "revision": "c6c2333678963fd89441f6ef15759250"
  },
  {
    "url": "posts/new-mafia-game-is-coming/index.html",
    "revision": "05a9bfa5bd0f193682dbb839fc08149a"
  },
  {
    "url": "posts/november-free-game-news/index.html",
    "revision": "ded3da1d99e0dfae556c2300e9bf7d7a"
  },
  {
    "url": "posts/playstation-plus-will-reduce-the-game-quality/index.html",
    "revision": "a96d02d4301aa0a0191c692ef074dbb2"
  },
  {
    "url": "posts/prime-gaming-free-game-news/index.html",
    "revision": "e180c586aa32ce3dac174913f61b3a43"
  },
  {
    "url": "posts/riot-games-will-add-new-content-to-league-of-legends-in-2023/index.html",
    "revision": "83ad8369e26d427180b2bae87867b0db"
  },
  {
    "url": "posts/sony-announced-23-games-that-will-be-available-for-playstation-users-in-2023/index.html",
    "revision": "6e8a7bcea7f89bb500a0e8d595c066f5"
  },
  {
    "url": "posts/sony-has-shared-the-first-images-of-the-gran-turismo-movie/index.html",
    "revision": "094b3fbbce92266dbb4b9851bb8b8183"
  },
  {
    "url": "posts/starfields-steam-page-opened/index.html",
    "revision": "3853f2b56197e24298a763876d68ad00"
  },
  {
    "url": "posts/the-all-time-concurrent-user-record-for-steam-has-been-broken/index.html",
    "revision": "39bc269280cbdf779c589b162e576ddf"
  },
  {
    "url": "posts/the-game-awards-2021/index.html",
    "revision": "7acb8a4014c15fdddc2f91af3f7eab1f"
  },
  {
    "url": "posts/the-games-that-will-be-added-to-xbox-game-pass-in-january-have-been-announced/index.html",
    "revision": "ae7ceab0194a849da725dafbb0076165"
  },
  {
    "url": "posts/the-most-sold-games-on-steam/index.html",
    "revision": "ce73c5de71fe109ce8ff0b1454027b83"
  },
  {
    "url": "posts/this-weeks-free-games-from-epic-games/index.html",
    "revision": "635b00fea04b9d9f808e8b4a7fdd7a55"
  },
  {
    "url": "posts/tomb-raider-series-are-free/index.html",
    "revision": "5ea28a3b3d01f334c478b1d02dffbc0e"
  },
  {
    "url": "posts/ubisofts-confusing-splinter-cell-remake-share/index.html",
    "revision": "9170aba75b1eb2ae4d6b135f1131c427"
  },
  {
    "url": "privacy-policy/index.html",
    "revision": "5542566c822e275b4ae6619d9c15ade3"
  },
  {
    "url": "watermark-logo.png",
    "revision": "cb69efd3c0246f905ee651b1d97697ac"
  },
  {
    "url": "xelite-gamer-logo.png",
    "revision": "97b7274f95cd4712b8cc07dba74c1f97"
  },
  {
    "url": "xelite-gamer-logo@2x.png",
    "revision": "2ea5e72878b1dc8992711c21f8bf69ad"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
addEventListener('message', event => {
  const replyPort = event.ports[0]
  const message = event.data
  if (replyPort && message && message.type === 'skip-waiting') {
    event.waitUntil(
      self.skipWaiting().then(
        () => replyPort.postMessage({ error: null }),
        error => replyPort.postMessage({ error })
      )
    )
  }
})
