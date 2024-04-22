using CS.Core.Configuration;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace CS.Web.Controllers;

[Route("api/db")]
[ApiController]
public class DbConnectionController : ControllerBase
{

    [HttpGet("connect")]
    public ActionResult connect()
    {
        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;

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

            return Ok("check console");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to connect to PostgreSQL server: {ex.Message}");
            return NotFound();
        }
    }

}
