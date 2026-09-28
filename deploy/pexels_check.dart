// Minimal reproduction of the app's Pexels call using the exact same
// package:http version as the project (0.12.2).
import 'package:http/http.dart' as http;

const key = 'UD20nrdwnb2kj0PfW4cgz4ThdTV9QU2IZT0Z5H6A9gOTf4x4PiwzJttU';

Future<void> main() async {
  final r = await http.get(
    Uri.parse('https://api.pexels.com/v1/curated?per_page=2&page=1'),
    headers: {'Authorization': key},
  );
  print('status: ${r.statusCode}');
  final body = r.body;
  print('body[:80]: ${body.length > 80 ? body.substring(0, 80) : body}');
}
