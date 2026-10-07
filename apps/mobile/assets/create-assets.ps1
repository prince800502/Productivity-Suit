$b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAGggJ/PchI7wAAAABJRU5ErkJggg=='
$bytes = [Convert]::FromBase64String($b64)
[IO.File]::WriteAllBytes('icon.png', $bytes)
[IO.File]::WriteAllBytes('splash.png', $bytes)
[IO.File]::WriteAllBytes('adaptive-icon.png', $bytes)
[IO.File]::WriteAllBytes('favicon.png', $bytes)
[IO.File]::WriteAllBytes('notification-icon.png', $bytes)
[IO.File]::WriteAllBytes('notification-sound.wav', [byte[]]::new(44))