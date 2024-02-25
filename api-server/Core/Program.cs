using System;
using Npgsql;

class Program
{
    static void Main()
    {
        var connectionString = "Host=34.118.10.176;Database=hubreview;Username=hubreview;Password=hubreview;Port=5432;SSL Mode=Require;Trust Server Certificate=true;";

        using var connection = new NpgsqlConnection(connectionString);
        try
        {
            connection.Open();
            Console.WriteLine("Connected to PostgreSQL server.");

            using var cmd = new NpgsqlCommand("select * from guestbook;", connection);
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                int id = reader.GetInt32(reader.GetOrdinal("entryid"));
                string firstColumnValue = reader.GetString(reader.GetOrdinal("guestname"));
                string secondColumnValue = reader.GetString(reader.GetOrdinal("content"));

                Console.WriteLine($"{id} - {firstColumnValue} - {secondColumnValue}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to connect to PostgreSQL server: {ex.Message}");
        }
    }
}
