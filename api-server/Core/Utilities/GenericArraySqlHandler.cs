using System.Data;
using Dapper;
using Newtonsoft.Json;

namespace CS.Core.Utilities;

public class GenericArrayHandler<T> : SqlMapper.TypeHandler<T[]>
{
    public override void SetValue(IDbDataParameter parameter, T[] value)
    {
        parameter.Value = value;
    }

    public override T[] Parse(object value) => JsonConvert.DeserializeObject<T[]>((string)value) ?? new T[0];
}

