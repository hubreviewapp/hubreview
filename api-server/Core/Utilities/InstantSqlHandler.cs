using System.Data;
using Dapper;
using NodaTime;

namespace CS.Core.Utilities;

// See https://github.com/DapperLib/Dapper/issues/198#issuecomment-436513676
public class InstantSqlHandler : SqlMapper.TypeHandler<Instant>
{
    public override Instant Parse(object value) => (Instant)value;

    public override void SetValue(IDbDataParameter parameter, Instant value)
    {
        parameter.Value = value;
    }
}

