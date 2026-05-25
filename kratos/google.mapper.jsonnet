local claims = { email_verified: false } + std.extVar('claims');

{
  identity: {
    traits: {
      [if 'email' in claims && claims.email_verified then 'email' else null]: claims.email,
      full_name:
        if 'name' in claims then claims.name
        else std.trim(
          (if 'given_name' in claims then claims.given_name else "") + " " +
          (if 'family_name' in claims then claims.family_name else "")
        ),
    },
  },
}
