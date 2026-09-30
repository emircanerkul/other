-- phpMyAdmin SQL Dump
-- version 5.1.0
-- https://www.phpmyadmin.net/
--
-- Anamakine: db
-- Üretim Zamanı: 28 Mar 2021, 17:56:06
-- Sunucu sürümü: 5.6.48
-- PHP Sürümü: 7.4.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Veritabanı: `default`
--

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `q`
--

CREATE TABLE `q` (
  `id` int(11) NOT NULL,
  `question` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `answer` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `q`
--

INSERT INTO `q` (`id`, `question`, `answer`) VALUES
(1, 'Birbiri üzerinde bulunan yassica maddelerin her biri', 'katman'),
(2, 'Bir organin yapi ögelerinden birini oluşturan hücreler bütünü', 'doku'),
(3, 'Ordu birliklerinden olmayan küçük silahlı birlik ', 'çete'),
(4, '\'miktarı az, sindirimi kolay yiyecekleri\" niteleyen sıfat ', 'hafif'),
(5, '\"güç, kudret\" anlamlarında, taraftar pankartlarında sıkça görülen italyanca kökenli sözcük', 'forza'),
(6, '\"tuhaf. komik\" anlamlarında bir sıfat', 'gülünç'),
(7, '\"tasarım\" anlamındaki, bir sanat eserinin, yapının veya teknik ürünün ilk taslağı', 'dizayn'),
(8, 'Arkadaşlık etme. birlikte bulunma', 'refakat'),
(9, 'Tercihe olanak veren olanaklardan her biri', 'seçenek'),
(10, 'Mecazi anlamda, \"yetişkinlere yakışır bağışlayıcı davranış\" ', 'büyüklük'),
(11, 'Kendisini acindırarak bir kimseden bir şey istemek ', 'dilenmek'),
(12, '\"o sırada, olduğu anda\" anlamında bir söz', 'esnasında'),
(13, 'Ünlem haliyle, bir isteğin, buyruğun hemen yerine getirileceğini bildiren söz', 'başüstüne'),
(14, 'Bir veya birkaç şeyi plastik bir torbanın içine koyup taşınabilir hale getirmek', 'poşetlemek'),
(15, 'Mecazen \"şuh, işveli, çekici\" anlamlarına gelen bir sıfat', 'dişi'),
(16, 'Ameliyat sonrası vücut içinde kalan doku artıklarını ve sıvıları dışarı atmak veya yara üzerindeki iltihabi akıtmakta kullanılan bükülgen tüp', 'dren'),
(17, 'Cinsel konularda ahlak kurallarına bağlılık', 'iffet'),
(18, 'Hristiyanlıkta, ilk günahı silmek ve hristiyanlaştırmak amacıyla yapılan işlem', 'vaftiz'),
(19, 'Bir yüzey üzerine etkide bulunan gücün yüz ölçümü birimine düşen miktarı', 'basınç'),
(20, 'Aşırı harcamalardan kaçınan, idareli', 'tutumlu'),
(21, 'Önemsiz, ufak tefek şeyler', 'öteberi'),
(22, 'Üst makamlardan alt makamlara, belli bir esasa dayanarak verilen buyruk ', 'direktif'),
(23, 'Sanatta çağdaşlaşma akımı', 'modernizm'),
(24, 'Kendi kendini gizlemek', 'saklanmak'),
(25, 'Kontrolü kaybedilmiş alışkanlık', 'bağımlılık'),
(26, '\"geçen, önceki, sabik\" anlamlarinda bir sıfat', 'eski'),
(27, 'Çocuk yuvası', 'kreş'),
(28, 'Bir sanat eserinin veya yazılı bir metnin taklidi. asil karşıtı', 'kopya'),
(29, 'Arkeolojik tepe', 'höyük'),
(30, 'Bir yapının yol düzeyinden aşagıda kalan bölümü', 'bodrum'),
(31, 'İstiklal marşımızın dördüncü kıtasında yer alan \"sınır boyu\" anlamındaki sözcük', 'serhat'),
(32, 'Atmosferin gözle görünen bölümü ', 'gökyüzü'),
(33, 'Niyet edenin dileğinin gerçekleşmesi halinde canından olan hayvan', 'adaklık'),
(34, '\"atılgan\" sözünün karşıt ve ters anlamlısı', 'çekingen'),
(35, '\"süpürge otu gibi dağınık ve çiçekli bitkilerle dolu alanlar\" için kullanılan söz', 'fundalık'),
(36, '\'büyük zarar ve sıkıntıya yol açan, eziyet veren kimse\" anlamında bir söz dizisi', 'başbelası'),
(37, ' Yarılan veya yırtılan deriyi bir araya getirip tutturmak için yapılan küçük bir cerrahi işlem ', 'dikişatmak'),
(38, 'Mülk, eşya ve servet meraklısı, sahip olma hırsına tutulmuş kişii', 'malcanlısı'),
(39, 'Bir devletin, bir hanedanın veya bir şehrin simgesi olarak kabul edilmiş olan sembol', 'arma'),
(40, 'Hiç olmazsa. hiç değilse\" anlamında bir zarf', 'bari'),
(41, 'Futbol. hentbol gibi takım oyunlarında hücum hattının sağ ve sol bölümü', 'kanat'),
(42, 'Kalin biçilmiş uzun tahtanın, mecazen \"kaba. anlayış anlamlarında da kullanılan adi', 'kalas'),
(43, '\"balıketinde\" anlamında bir sıfat', 'dolgun'),
(44, 'Kim veya ne olduğu seçilemeyen, belli belirsiz, koyu renkli biçim, silüet', 'karaltı'),
(45, 'Elektrik akimini veya ısıyı bir yerden başka bir yere aktaran', 'iletken'),
(46, 'Kişinin veya kurumların kendi kendilerini kısıtlaması', 'otosansür'),
(47, '\"sağlıkla. keyifle, ağız tadıyla\" anlamlarında bir zarf', 'afiyetle'),
(48, 'İstiklal marşımızın onuncu kıtasında yer alan, \"yıkılma, çökme\" anlamındaki sözcük ', 'izmihlal'),
(49, 'Dumanını savurtmak ', 'tüttürmek'),
(50, '\"beyin. kalp gibi yaşamsal organların, travma benzeri bir nedenle fonksiyonları anormalleşmek\" anlamında kullanılan tabir ', 'şokagirmek'),
(51, 'İnsanoğlunun kayda geçirdiği, hala etkileri süren geçmiş dönem ', 'yakıntarih');

--
-- Dökümü yapılmış tablolar için indeksler
--

--
-- Tablo için indeksler `q`
--
ALTER TABLE `q`
  ADD PRIMARY KEY (`id`);

--
-- Dökümü yapılmış tablolar için AUTO_INCREMENT değeri
--

--
-- Tablo için AUTO_INCREMENT değeri `q`
--
ALTER TABLE `q`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
