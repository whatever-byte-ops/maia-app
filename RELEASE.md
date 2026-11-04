# Maintainer release instructions

These instructions are for maintainers. They are separate from the
user-facing [README](./README.md).

## Signed Android release

Keep the upload keystore outside Git and back it up securely. Create it once:

```bash
keytool -genkeypair -v \
  -keystore android/maia-upload.jks \
  -alias maia-upload \
  -keyalg RSA -keysize 4096 \
  -validity 10000
```

Build a signed APK by supplying the keystore values as Gradle properties:

```bash
cd android
./gradlew assembleRelease \
  -PMAIA_UPLOAD_STORE_FILE="$PWD/maia-upload.jks" \
  -PMAIA_UPLOAD_STORE_PASSWORD='store-password' \
  -PMAIA_UPLOAD_KEY_ALIAS='maia-upload' \
  -PMAIA_UPLOAD_KEY_PASSWORD='key-password'
```

The signed APK is written to
`android/app/build/outputs/apk/release/app-release.apk`. Use `bundleRelease`
instead when Google Play requires an AAB. Increment `MAIA_VERSION_CODE` for
each release.

## Signed Git commits

Install GnuPG and configure a Git signing key locally. Never commit private keys
or passwords:

```bash
brew install gnupg pinentry-mac
gpg --full-generate-key
git config --global user.signingkey YOUR_KEY_ID
git config --global commit.gpgsign true
git config --global tag.gpgsign true
```

Export only the public key and add it to GitHub under **Settings → SSH and GPG
keys**:

```bash
gpg --armor --export YOUR_KEY_ID
```

After adding the public key to GitHub, create a signed commit locally:

```bash
git commit -S -m "Describe the changes"
git log -1 --show-signature
```

The GitHub commit page should show **Verified**. The email on the GPG key must
be verified on the GitHub account used for the repository.

## Configure the Android upload key

The GPG key does not sign Android apps. Create a separate Android upload
keystore and keep it outside Git:

```bash
keytool -genkeypair -v \
  -keystore android/maia-upload.jks \
  -alias maia-upload \
  -keyalg RSA -keysize 4096 \
  -validity 10000
```

Build a signed APK with the keystore credentials:

```bash
cd android
./gradlew assembleRelease \
  -PMAIA_UPLOAD_STORE_FILE="$PWD/maia-upload.jks" \
  -PMAIA_UPLOAD_STORE_PASSWORD='store-password' \
  -PMAIA_UPLOAD_KEY_ALIAS='maia-upload' \
  -PMAIA_UPLOAD_KEY_PASSWORD='key-password'
```
