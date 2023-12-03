using BCryptNet = BCrypt.Net.BCrypt;

namespace CS.Core.Utilities;

public interface IBCryptPasswordHasher
{
    string HashPassword(string password);
    bool VerifyHashedPassword(string inputPassword, string hashedPassword);
}

public class BCryptPasswordHasher : IBCryptPasswordHasher
{
    public string HashPassword(string password)
    {
        return BCryptNet.HashPassword(password, 6); // weak work factor
    }

    public bool VerifyHashedPassword(string inputPassword, string hashedPassword)
    {
        return BCryptNet.Verify(inputPassword, hashedPassword);
    }
}

