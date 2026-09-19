package tjrs.dipred.orcamento.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import tjrs.dipred.orcamento.model.Comarca;

@Repository
public interface ComarcaRepository extends JpaRepository<Comarca, Integer> {
    List<Comarca> findAllByOrderByNomeAsc();
}
