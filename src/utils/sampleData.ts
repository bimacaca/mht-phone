/**
 * Generates realistic sample .mht files for testing (1 contact per file)
 */
export function createSampleMhtFiles(): File[] {
  const file1Content = `From: <Saved by Web Browser>
Subject: Formulir Pelanggan - Budi Santoso
Date: Sun, 25 Oct 2026 14:20:00 +0700
MIME-Version: 1.0
Content-Type: multipart/related; boundary="----=_NextPart_001_BUDI"

------=_NextPart_001_BUDI
Content-Type: text/html; charset="utf-8"
Content-Transfer-Encoding: quoted-printable

<!DOCTYPE html>
<html>
<head><meta charset=3D"utf-8"><title>Pelanggan Budi Santoso</title></head>
<body>
<h2>Data Kontak Pelanggan</h2>
<p><strong>Nama:</strong> Budi Santoso</p>
<p><strong>Kota:</strong> Jakarta Selatan</p>
<p><strong>Nomor WhatsApp / HP:</strong> 0812-9876-5432</p>
<p><strong>Status:</strong> Terverifikasi</p>
</body>
</html>
------=_NextPart_001_BUDI--`;

  const file2Content = `From: <Saved by Web Browser>
Subject: Formulir Pelanggan - Siti Aminah
Date: Mon, 26 Oct 2026 09:15:00 +0700
MIME-Version: 1.0
Content-Type: multipart/related; boundary="----=_NextPart_002_SITI"

------=_NextPart_002_SITI
Content-Type: text/html; charset="utf-8"
Content-Transfer-Encoding: quoted-printable

<html>
<body>
<h2>Data Kontak Pelanggan</h2>
<p><strong>Nama:</strong> Siti Aminah</p>
<p><strong>Kota:</strong> Surabaya</p>
<p><strong>No Telepon / WA:</strong> 0856-9876-5432</p>
<p><strong>Status:</strong> Aktif</p>
</body>
</html>
------=_NextPart_002_SITI--`;

  const file3Content = `From: <Saved by Web Browser>
Subject: Formulir Pelanggan - Rian Hidayat
Date: Mon, 26 Oct 2026 16:45:00 +0700
MIME-Version: 1.0
Content-Type: multipart/related; boundary="----=_NextPart_003_RIAN"

------=_NextPart_003_RIAN
Content-Type: text/html; charset="utf-8"
Content-Transfer-Encoding: quoted-printable

<html>
<body>
<h2>Data Kontak Pelanggan</h2>
<p><strong>Nama:</strong> Rian Hidayat</p>
<p><strong>Kota:</strong> Bandung</p>
<p><strong>Kontak HP:</strong> 0878-5432-1098</p>
<p><strong>Status:</strong> Siap Dihubungi</p>
</body>
</html>
------=_NextPart_003_RIAN--`;

  const file1 = new File([file1Content], 'Pelanggan_01_Budi.mht', {
    type: 'multipart/related',
  });
  const file2 = new File([file2Content], 'Pelanggan_02_Siti.mht', {
    type: 'multipart/related',
  });
  const file3 = new File([file3Content], 'Pelanggan_03_Rian.mht', {
    type: 'multipart/related',
  });

  return [file1, file2, file3];
}
