<?php

namespace App\Entity;

use App\Repository\RepositoryEntityRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Gedmo\Mapping\Annotation\Timestampable;

#[ORM\Entity(repositoryClass: RepositoryEntityRepository::class)]
class RepositoryEntity
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private $id;

    #[ORM\OneToMany(mappedBy: 'repositoryEntity', targetEntity: TraitEntity::class)]
    private $traitEntities;

    #[ORM\Column(type: 'string', length: 255)]
    private $owner;

    #[ORM\Column(type: 'string', length: 255)]
    private $repository;

    #[ORM\Column(type: 'string', length: 255)]
    private $version;

    #[ORM\Column(type: 'datetime')]
    #[Timestampable(on: 'create')]
    private $created;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private $lastScan;

    #[ORM\Column(type: 'integer', nullable: true, options: ["default" => 0])]
    private $scanCount;

    public function __construct()
    {
        $this->traitEntities = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    /**
     * @return Collection<int, TraitEntity>
     */
    public function getTraitEntities(): Collection
    {
        return $this->traitEntities;
    }

    public function addTraitEntities(TraitEntity $traitEntities): self
    {
        if (!$this->traitEntities->contains($traitEntities)) {
            $this->traitEntities[] = $traitEntities;
            $traitEntities->setRepositoryEntity($this);
        }

        return $this;
    }

    public function removeTraitEntities(TraitEntity $traitEntities): self
    {
        if ($this->traitEntities->removeElement($traitEntities)) {
            // set the owning side to null (unless already changed)
            if ($traitEntities->getRepositoryEntity() === $this) {
                $traitEntities->setRepositoryEntity(null);
            }
        }

        return $this;
    }

    public function getOwner(): ?string
    {
        return $this->owner;
    }

    public function setOwner(string $owner): self
    {
        $this->owner = $owner;

        return $this;
    }

    public function getRepository(): ?string
    {
        return $this->repository;
    }

    public function setRepository(string $repository): self
    {
        $this->repository = $repository;

        return $this;
    }

    public function getVersion(): ?string
    {
        return $this->version;
    }

    public function setVersion(string $version): self
    {
        $this->version = $version;

        return $this;
    }

    public function getCreated(): ?\DateTimeInterface
    {
        return $this->created;
    }

    public function setCreated(\DateTimeInterface $created): self
    {
        $this->created = $created;

        return $this;
    }

    public function getLastScan(): ?\DateTimeInterface
    {
        return $this->lastScan;
    }

    public function setLastScan(\DateTimeInterface $lastScan): self
    {
        $this->lastScan = $lastScan;

        return $this;
    }

    public function getScanCount(): ?int
    {
        return $this->scanCount;
    }

    public function setScanCount(int $scanCount): self
    {
        $this->scanCount = $scanCount;

        return $this;
    }

    public function increaseScanCount(): self
    {
        $scanCount = $this->scanCount;
        $this->scanCount = intval($scanCount) + 1;
        return $this;
    }

    public function __toString()
    {
        $string = $this->getOwner() . '/' . $this->getRepository() . '/' . $this->getVersion();

        if ($this->getLastScan()) {
            $string .= ' Latest Run: ' . $this->getLastScan()->format('Y.m.d h:i:s');
        }

        return $string;
    }
}
